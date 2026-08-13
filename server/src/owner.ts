import { Router } from 'express';
import pool from './db';
import { requireRole } from './auth';

const router = Router();

// Restrict all routes to venue_owner only
router.use(requireRole(['venue_owner']));

router.get('/roster', async (req, res) => {
    try {
        const ownerId = (req as any).user.sub || (req as any).user.id;
        // Find players registered to a turf owned by this owner
        const query = `
            SELECT p.id, p.name, p.phone, p.created_at, 
                   f.name AS home_turf_name
            FROM profiles p
            JOIN facilities f ON f.id = p.home_turf_id
            WHERE f.owner_id = $1
        `;
        const result = await pool.query(query, [ownerId]);
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/tournaments', async (req, res) => {
    // Scaffold functionality to create a tournament linked to facilities
    res.json({ success: true, message: 'Tournament created via authorized owner' });
});

router.get('/analytics', async (req, res) => {
    // Scaffold occupancy rates and yields
    res.json({ occupancyRate: '85%', dailyRevenue: 1200 });
});

export default router;
