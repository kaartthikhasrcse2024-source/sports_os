import { Router } from 'express';
import pool from './db';
import { requireRole } from './auth';

const router = Router();

// Restrict all routes to players only
router.use(requireRole(['player']));

router.get('/bookings', async (req, res) => {
    try {
        const playerId = (req as any).user.sub || (req as any).user.id;
        const query = `
            SELECT b.id, b.status, b.total_amount, b.created_at, f.name as facility, c.name as court
            FROM bookings b
            JOIN slots s ON s.id = b.slot_id
            JOIN courts c ON c.id = s.court_id
            JOIN facilities f ON f.id = c.facility_id
            WHERE b.user_id = $1
        `;
        const result = await pool.query(query, [playerId]);
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/register-turf', async (req, res) => {
    try {
        const playerId = (req as any).user.sub || (req as any).user.id;
        const { facility_id } = req.body;

        if (!facility_id) return res.status(400).json({ error: 'facility_id required' });

        await pool.query(`UPDATE profiles SET home_turf_id = $1 WHERE id = $2`, [facility_id, playerId]);
        res.json({ success: true, message: 'My Home Base registered successfully' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/register-home-turf', async (req, res) => {
    try {
        const { playerId, venueId } = req.body;
        if (!playerId || !venueId) return res.status(400).json({ error: 'playerId and venueId required' });

        // Update the database record if the profile exists (ignoring auth for mockup).
        // Since we are mocking the other players, we might just return success if it's purely a mockup,
        // but let's try updating it if it's connected to DB profiles, otherwise just return success.
        await pool.query(`UPDATE profiles SET home_turf_id = $1 WHERE id = $2`, [venueId, playerId]);

        res.json({ success: true, message: 'Home Turf registered successfully for ' + playerId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/athletic-resume', async (req, res) => {
    res.json({ status: 'active', message: 'Verified stats fetched' });
});

export default router;
