import { Router } from 'express';
import pool from './db';

const router = Router();

// Fetch active players for Player Talent Pool
router.get('/players', async (req, res) => {
    const { sport, position, height_cm_min, athletic_score_min, q } = req.query;
    try {
        let query = `
            SELECT p.id, p.name as name, a.playing_status as availability_status, p.role as sport_type, 
                   a.primary_position as position, 0 as win_rate, 
                   a.height_cm, a.weight_kg, a.sprint_10m_sec, a.vertical_jump_cm, a.stamina_rating, a.overall_athletic_score
            FROM profiles p
            LEFT JOIN athletic_profiles a ON p.id = a.id
            WHERE a.open_for_scouting = true
        `;
        const params: any[] = [];

        if (q) {
            params.push(`%${q}%`);
            query += ` AND (p.name ILIKE $${params.length} OR a.primary_position ILIKE $${params.length})`;
        }

        if (position) {
            params.push(position);
            query += ` AND a.primary_position = $${params.length}`;
        }
        if (height_cm_min) {
            params.push(parseInt(height_cm_min as string, 10));
            query += ` AND a.height_cm >= $${params.length}`;
        }
        if (athletic_score_min) {
            params.push(parseFloat(athletic_score_min as string));
            query += ` AND a.overall_athletic_score >= $${params.length}`;
        }

        query += ` ORDER BY a.overall_athletic_score DESC NULLS LAST LIMIT 50`;
        const results = await pool.query(query, params);
        res.json(results.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
