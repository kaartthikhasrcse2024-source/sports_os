import { Router } from 'express';
import pool from './db';
import { requireVerifiedRole } from './auth';
import { createNotification } from './services/notifications';

const router = Router();

// Get all tournaments dynamically so players/organizers can view them
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, f.name as facility_name 
             FROM tournaments t 
             LEFT JOIN facilities f ON t.facility_id = f.id
             ORDER BY t.created_at DESC`
        );
        res.json(result.rows);
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Tournament (VERIFIED TOURNAMENT ORGANIZER ONLY)
router.post('/', requireVerifiedRole(['TOURNAMENT_ORGANIZER']), async (req, res) => {
    const { facility_id, name, format, max_teams, start_date } = req.body;
    const organizerId = (req as any).user.sub || (req as any).user.id;
    try {
        const result = await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date, organizer_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [facility_id, name, format, max_teams, start_date, organizerId]
        );
        res.json(result.rows[0]);
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Team Sign-Up & Entry
router.post('/:id/teams', requireVerifiedRole(['PLAYER', 'TOURNAMENT_ORGANIZER']), async (req, res) => {
    const { team_name } = req.body;
    const { id } = req.params;
    const userId = (req as any).user.sub || (req as any).user.id;

    try {
        await pool.query('BEGIN');

        // Enforce lock bounding maximum teams seamlessly generating accurate capacity limits
        const tQuery = await pool.query(`SELECT id, name, max_teams, status, organizer_id FROM tournaments WHERE id = $1 FOR UPDATE`, [id]);
        if (tQuery.rows.length === 0) throw new Error('Tournament not found');

        if (tQuery.rows[0].status !== 'OPEN') {
            await pool.query('ROLLBACK');
            return res.status(403).json({ error: 'Registration is closed' });
        }

        const maxTeams = tQuery.rows[0].max_teams;

        // Check explicit registration counts avoiding concurrent bypass potentials
        const countQuery = await pool.query(`SELECT count(id) FROM tournament_teams WHERE tournament_id = $1`, [id]);
        if (parseInt(countQuery.rows[0].count) >= maxTeams) {
            await pool.query('ROLLBACK');
            return res.status(409).json({ error: 'Tournament registration is completely full.' });
        }

        const result = await pool.query(
            `INSERT INTO tournament_teams (tournament_id, team_name, captain_id) VALUES ($1, $2, $3) RETURNING *`,
            [id, team_name, userId]
        );

        const team = result.rows[0];

        // Add creator securely to the normalized mapping table natively
        await pool.query(
            `INSERT INTO tournament_team_players (team_id, player_id, status) VALUES ($1, $2, 'ACTIVE')`,
            [team.id, userId]
        );

        await pool.query('COMMIT');

        // Cross Actor Notification Pipeline resolving post-transaction hooks precisely avoiding mock limits
        if (tQuery.rows[0].organizer_id) {
            await createNotification(pool, {
                recipientId: tQuery.rows[0].organizer_id,
                actorId: userId,
                type: 'TOURNAMENT_TEAM_REGISTERED',
                title: 'New Team Registration',
                message: `Team ${team_name} successfully registered for ${tQuery.rows[0].name}`,
                entityType: 'TOURNAMENT',
                entityId: id as string
            });
        }

        res.json(team);
    } catch (e: any) {
        await pool.query('ROLLBACK');
        console.error('Tournament team sign-up error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join Active Team seamlessly
router.post('/teams/:team_id/join', requireVerifiedRole(['PLAYER']), async (req, res) => {
    const team_id = req.params.team_id as string;
    const playerId = (req as any).user.sub || (req as any).user.id;

    try {
        // Enforce team availability preventing unauthorized modifications natively
        const teamCheck = await pool.query('SELECT id, tournament_id FROM tournament_teams WHERE id = $1', [team_id]);
        if (teamCheck.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

        // Enforce deduplication natively checking status directly blocking double overlaps
        const exists = await pool.query('SELECT 1 FROM tournament_team_players WHERE team_id = $1 AND player_id = $2', [team_id, playerId]);
        if (exists.rows.length > 0) return res.json({ success: true, message: "Already a member." });

        await pool.query(
            `INSERT INTO tournament_team_players (team_id, player_id, status)
             VALUES ($1, $2, 'ACTIVE')
             ON CONFLICT (team_id, player_id) DO NOTHING`,
            [team_id, playerId]
        );
        res.json({ success: true, message: "Successfully joined team securely." });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Leave Team / Remove Player securely
router.delete('/teams/:team_id/players/:player_id', requireVerifiedRole(['PLAYER', 'TOURNAMENT_ORGANIZER']), async (req, res) => {
    const team_id = req.params.team_id as string;
    const player_id = req.params.player_id as string;
    const authId = (req as any).user.sub || (req as any).user.id;

    try {
        // Allow self removal OR removal by explicitly mapped captain
        if (authId !== player_id) {
            const team = await pool.query('SELECT captain_id FROM tournament_teams WHERE id = $1', [team_id]);
            if (team.rows.length === 0 || team.rows[0].captain_id !== authId) {
                return res.status(403).json({ error: 'You are not authorized to remove this player.' });
            }
        }

        await pool.query('DELETE FROM tournament_team_players WHERE team_id = $1 AND player_id = $2', [team_id, player_id]);
        res.json({ success: true, message: 'Player securely removed.' });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate Brackets
router.post('/:id/generate', requireVerifiedRole(['TOURNAMENT_ORGANIZER']), async (req, res) => {
    const { id } = req.params;
    const organizerId = (req as any).user.sub || (req as any).user.id;
    try {
        const tQuery = await pool.query(`SELECT format, organizer_id FROM tournaments WHERE id = $1`, [id]);
        if (tQuery.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        // Strict Authorization Constraint bounding the explicitly matched identity over generation
        if (tQuery.rows[0].organizer_id !== organizerId) {
            return res.status(403).json({ error: 'You do not have permission to generate this tournament bracket.' });
        }

        const format = tQuery.rows[0].format;
        const teamsQuery = await pool.query(`SELECT id FROM tournament_teams WHERE tournament_id = $1`, [id]);
        const teams = teamsQuery.rows;

        if (teams.length < 2) return res.status(400).json({ error: 'Need at least 2 teams' });

        // Clear existing tree
        await pool.query(`DELETE FROM bracket_matches WHERE tournament_id = $1`, [id]);

        if (format === 'single_elim') {
            // 1) Calc geometry
            const numRounds = Math.ceil(Math.log2(teams.length));
            const totalSlots = Math.pow(2, numRounds);

            // Base nodes structure representing match relational paths (child->parent)
            // We can generate backwards from root (final) using an array block
            let matchesByRound: any[][] = Array.from({ length: numRounds }, () => []);

            let nextMatchMapping = new Map();
            // Generate empty rounds
            for (let r = numRounds; r >= 1; r--) {
                const matchCount = Math.pow(2, numRounds - r); // Finals(1), Semis(2), Quarters(4)
                for (let i = 0; i < matchCount; i++) {
                    const mRes = await pool.query(
                        `INSERT INTO bracket_matches(tournament_id, round, match_index) VALUES($1, $2, $3) RETURNING id`,
                        [id, r, i]
                    );
                    const matchId = mRes.rows[0].id;
                    matchesByRound[r - 1].push(matchId);

                    // Wire to parent
                    if (r < numRounds) {
                        const parentIndex = Math.floor(i / 2);
                        const parentId = matchesByRound[r][parentIndex];
                        await pool.query(`UPDATE bracket_matches SET next_match_id = $1 WHERE id = $2`, [parentId, matchId]);
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
                if (tA && !tB) winner = tA;
                if (!tA && tB) winner = tB;

                await pool.query(
                    `UPDATE bracket_matches SET team_a_id = $1, team_b_id = $2, winner_id = $3 WHERE id = $4`,
                    [tA, tB, winner, round1Matches[i]]
                );

                // Instantly propagate Bye winner downwards natively
                if (winner) {
                    const mR = await pool.query(`SELECT next_match_id, match_index FROM bracket_matches WHERE id = $1`, [round1Matches[i]]);
                    const nextId = mR.rows[0].next_match_id;
                    if (nextId) {
                        const branch = r1IndexToBranch(i);
                        const field = branch === 'left' ? 'team_a_id' : 'team_b_id';
                        await pool.query(`UPDATE bracket_matches SET ${field} = $1 WHERE id = $2`, [winner, nextId]);
                    }
                }
            }

            // Branch routing helper mapping index to left/right bounds strictly
            function r1IndexToBranch(idx: number) { return idx % 2 === 0 ? 'left' : 'right'; }
        }
        else if (format === 'round_robin') {
            let matchIdx = 0;
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    await pool.query(
                        `INSERT INTO bracket_matches(tournament_id, round, match_index, team_a_id, team_b_id) VALUES($1, $2, $3, $4, $5)`,
                        [id, 1, matchIdx++, teams[i].id, teams[j].id]
                    );
                }
            }
        }

        res.json({ success: true });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/data', async (req, res) => {
    const { id } = req.params;
    try {
        const teams = await pool.query(`SELECT * FROM tournament_teams WHERE tournament_id = $1`, [id]);
        const matches = await pool.query(`SELECT * FROM bracket_matches WHERE tournament_id = $1 ORDER BY round ASC, match_index ASC`, [id]);

        // Fetch explicit authentic players mapped mathematically via junction table
        const players = await pool.query(
            `SELECT p.id, p.name, p.sport_type, p.position, tp.team_id 
             FROM profiles p
             JOIN tournament_team_players tp ON p.id = tp.player_id
             JOIN tournament_teams tt ON tp.team_id = tt.id
             WHERE tt.tournament_id = $1 AND tp.status = 'ACTIVE'`, [id]);

        res.json({ teams: teams.rows, matches: matches.rows, roster: players.rows });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin resolving logic triggering cascaded boundaries forwards mapping strictly
router.post('/:id/matches/:match_id/winner', requireVerifiedRole(['TOURNAMENT_ORGANIZER']), async (req, res) => {
    const { id, match_id } = req.params;
    const { winner_id } = req.body;
    const organizerId = (req as any).user.sub || (req as any).user.id;

    try {
        // Enforce ownership
        const tCheck = await pool.query('SELECT organizer_id FROM tournaments WHERE id = $1', [id]);
        if (tCheck.rows[0]?.organizer_id !== organizerId) {
            return res.status(403).json({ error: 'Unauthorized to modify tournament matches.' });
        }

        await pool.query(`UPDATE bracket_matches SET winner_id = $1 WHERE id = $2`, [winner_id, match_id]);

        // Propagate branch correctly bounding explicit children sequentially
        const m = await pool.query(`SELECT next_match_id, match_index FROM bracket_matches WHERE id = $1`, [match_id]);
        const mappingId = m.rows[0]?.next_match_id;

        if (mappingId) {
            const side = m.rows[0].match_index % 2 === 0 ? 'team_a_id' : 'team_b_id';
            await pool.query(`UPDATE bracket_matches SET ${side} = $1 WHERE id = $2`, [winner_id, mappingId]);
        }
        res.json({ success: true });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Organizer Court Locking
router.post('/:id/matches/:match_id/slot', requireVerifiedRole(['TOURNAMENT_ORGANIZER']), async (req, res) => {
    const { id, match_id } = req.params;
    const { slot_id } = req.body;
    const organizerId = (req as any).user.sub || (req as any).user.id;
    try {
        // Enforce ownership natively validating organizer rights gracefully
        const tCheck = await pool.query('SELECT organizer_id FROM tournaments WHERE id = $1', [id]);
        if (tCheck.rows[0]?.organizer_id !== organizerId) {
            return res.status(403).json({ error: 'Unauthorized to lock slots.' });
        }
        await pool.query(`UPDATE bracket_matches SET court_slot_id = $1 WHERE id = $2`, [slot_id, match_id]);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Create tournament error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
