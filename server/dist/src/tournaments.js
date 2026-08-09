"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const router = (0, express_1.Router)();
// Create Tournament
router.post('/', async (req, res) => {
    const { facility_id, name, format, max_teams, start_date } = req.body;
    try {
        const result = await db_1.default.query(`INSERT INTO tournaments (facility_id, name, format, max_teams, start_date) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`, [facility_id, name, format, max_teams, start_date]);
        res.json(result.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Create Team Registration
router.post('/:id/teams', async (req, res) => {
    const { team_name } = req.body;
    const { id } = req.params;
    try {
        const result = await db_1.default.query(`INSERT INTO tournament_teams (tournament_id, team_name) VALUES ($1, $2) RETURNING *`, [id, team_name]);
        res.json(result.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Generate Brackets
router.post('/:id/generate', async (req, res) => {
    const { id } = req.params;
    try {
        const tQuery = await db_1.default.query(`SELECT format FROM tournaments WHERE id = $1`, [id]);
        if (tQuery.rows.length === 0)
            return res.status(404).json({ error: 'Not found' });
        const format = tQuery.rows[0].format;
        const teamsQuery = await db_1.default.query(`SELECT id FROM tournament_teams WHERE tournament_id = $1`, [id]);
        const teams = teamsQuery.rows;
        if (teams.length < 2)
            return res.status(400).json({ error: 'Need at least 2 teams' });
        // Clear existing tree
        await db_1.default.query(`DELETE FROM bracket_matches WHERE tournament_id = $1`, [id]);
        if (format === 'single_elim') {
            // 1) Calc geometry
            const numRounds = Math.ceil(Math.log2(teams.length));
            const totalSlots = Math.pow(2, numRounds);
            // Base nodes structure representing match relational paths (child->parent)
            // We can generate backwards from root (final) using an array block
            let matchesByRound = Array.from({ length: numRounds }, () => []);
            let nextMatchMapping = new Map();
            // Generate empty rounds
            for (let r = numRounds; r >= 1; r--) {
                const matchCount = Math.pow(2, numRounds - r); // Finals(1), Semis(2), Quarters(4)
                for (let i = 0; i < matchCount; i++) {
                    const mRes = await db_1.default.query(`INSERT INTO bracket_matches (tournament_id, round, match_index) VALUES ($1, $2, $3) RETURNING id`, [id, r, i]);
                    const matchId = mRes.rows[0].id;
                    matchesByRound[r - 1].push(matchId);
                    // Wire to parent
                    if (r < numRounds) {
                        const parentIndex = Math.floor(i / 2);
                        const parentId = matchesByRound[r][parentIndex];
                        await db_1.default.query(`UPDATE bracket_matches SET next_match_id = $1 WHERE id = $2`, [parentId, matchId]);
                    }
                }
            }
            // Populate Rd1 Teams via seeding layout
            // To properly distribute byes, we pair top vs bottom seeds roughly
            // Here we do a simplified sequential layout 
            let round1Matches = matchesByRound[0];
            let tIdx = 0;
            for (let i = 0; i < round1Matches.length; i++) {
                const tA = teams[tIdx++]?.id || null;
                const tB = teams[tIdx++]?.id || null;
                let winner = null;
                // Auto-advance byes
                if (tA && !tB)
                    winner = tA;
                if (!tA && tB)
                    winner = tB;
                await db_1.default.query(`UPDATE bracket_matches SET team_a_id = $1, team_b_id = $2, winner_id = $3 WHERE id = $4`, [tA, tB, winner, round1Matches[i]]);
                // Instantly propagate Bye winner downwards natively
                if (winner) {
                    const mR = await db_1.default.query(`SELECT next_match_id, match_index FROM bracket_matches WHERE id = $1`, [round1Matches[i]]);
                    const nextId = mR.rows[0].next_match_id;
                    if (nextId) {
                        const branch = r1IndexToBranch(i);
                        const field = branch === 'left' ? 'team_a_id' : 'team_b_id';
                        await db_1.default.query(`UPDATE bracket_matches SET ${field} = $1 WHERE id = $2`, [winner, nextId]);
                    }
                }
            }
            // Branch routing helper mapping index to left/right bounds strictly
            function r1IndexToBranch(idx) { return idx % 2 === 0 ? 'left' : 'right'; }
        }
        else if (format === 'round_robin') {
            let matchIdx = 0;
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    await db_1.default.query(`INSERT INTO bracket_matches (tournament_id, round, match_index, team_a_id, team_b_id) VALUES ($1, $2, $3, $4, $5)`, [id, 1, matchIdx++, teams[i].id, teams[j].id]);
                }
            }
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:id/data', async (req, res) => {
    const { id } = req.params;
    const teams = await db_1.default.query(`SELECT * FROM tournament_teams WHERE tournament_id = $1`, [id]);
    const matches = await db_1.default.query(`SELECT * FROM bracket_matches WHERE tournament_id = $1 ORDER BY round ASC, match_index ASC`, [id]);
    res.json({ teams: teams.rows, matches: matches.rows });
});
// Admin resolving logic triggering cascaded boundaries forwards mapping strictly
router.post('/:id/matches/:match_id/winner', async (req, res) => {
    const { match_id } = req.params;
    const { winner_id } = req.body;
    try {
        await db_1.default.query(`UPDATE bracket_matches SET winner_id = $1 WHERE id = $2`, [winner_id, match_id]);
        // Propagate branch correctly bounding explicit children sequentially
        const m = await db_1.default.query(`SELECT next_match_id, match_index FROM bracket_matches WHERE id = $1`, [match_id]);
        const mappingId = m.rows[0]?.next_match_id;
        if (mappingId) {
            const side = m.rows[0].match_index % 2 === 0 ? 'team_a_id' : 'team_b_id';
            await db_1.default.query(`UPDATE bracket_matches SET ${side} = $1 WHERE id = $2`, [winner_id, mappingId]);
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Organizer Court Locking
router.post('/:id/matches/:match_id/slot', async (req, res) => {
    const { match_id } = req.params;
    const { slot_id } = req.body;
    try {
        await db_1.default.query(`UPDATE bracket_matches SET court_slot_id = $1 WHERE id = $2`, [slot_id, match_id]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
