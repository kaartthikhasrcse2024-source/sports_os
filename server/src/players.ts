import { Router } from 'express';
import pool from './db';
import { requireAuth } from './auth';

const router = Router();

// Retrieve aggregate totals exposing explicit verified statuses exclusively
router.get('/:id/stats', async (req, res) => {
    const { id } = req.params;
    try {
        const stats = await pool.query(
            `SELECT SUM(goals) as total_goals, SUM(points) as total_points, SUM(fouls) as total_fouls, SUM(minutes_played) as total_minutes
             FROM match_stats 
             WHERE player_id = $1`, [id]
        );
        const totals = stats.rows[0];

        const matchHistory = await pool.query(`
            SELECT ms.*, bm.round, bm.tournament_id, t.name as tournament_name
            FROM match_stats ms
            JOIN bracket_matches bm ON ms.match_id = bm.id
            JOIN tournaments t ON bm.tournament_id = t.id
            WHERE ms.player_id = $1
            ORDER BY ms.created_at DESC
        `, [id]);

        res.json({
            verified: true,
            career_totals: totals,
            history: matchHistory.rows
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Fetch Free Agent Status accurately sorting
router.get('/free-agents', async (req, res) => {
    const { sport, position } = req.query;
    try {
        let query = `SELECT id, name, availability_status, sport_type, position, win_rate FROM profiles WHERE availability_status IN ('open_to_play', 'looking_for_team')`;
        const params: any[] = [];

        if (sport) {
            params.push(sport);
            query += ` AND sport_type = $${params.length}`;
        }
        if (position) {
            params.push(position);
            query += ` AND position = $${params.length}`;
        }

        query += ` ORDER BY win_rate DESC LIMIT 50`;
        const results = await pool.query(query, params);
        res.json(results.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Fetch public athletic profile
router.get('/:id/athletic', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM athletic_profiles WHERE id = $1', [id]);
        res.json(result.rows[0] || null);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Update personal physical attributes and scouting availability
router.put('/athletic', requireAuth, async (req, res) => {
    const user = (req as any).user;
    const {
        height_cm, weight_kg, dominant_foot_hand, primary_position,
        secondary_positions, playing_status, open_for_scouting
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO athletic_profiles (
                id, height_cm, weight_kg, dominant_foot_hand, primary_position, 
                secondary_positions, playing_status, open_for_scouting, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (id) DO UPDATE SET
                height_cm = EXCLUDED.height_cm,
                weight_kg = EXCLUDED.weight_kg,
                dominant_foot_hand = EXCLUDED.dominant_foot_hand,
                primary_position = EXCLUDED.primary_position,
                secondary_positions = EXCLUDED.secondary_positions,
                playing_status = EXCLUDED.playing_status,
                open_for_scouting = EXCLUDED.open_for_scouting,
                updated_at = NOW()
            RETURNING *;
        `, [
            user.sub, height_cm, weight_kg, dominant_foot_hand, primary_position,
            secondary_positions, playing_status, open_for_scouting
        ]);

        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
