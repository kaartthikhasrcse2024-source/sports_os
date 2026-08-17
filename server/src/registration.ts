import { Router } from 'express';
import pool from './db';
import { requireAuth, normalizeRole } from './auth';

const router = Router();

router.get('/status', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const userId = user.sub || user.id;

        let rawRole = user.user_metadata?.role || user.app_metadata?.role;
        if (user.role && user.role !== 'authenticated' && user.role !== 'anon') rawRole = rawRole || user.role;
        const role = normalizeRole(rawRole || 'PLAYER');

        let tableName = '';
        if (role === 'PLAYER') {
            tableName = 'player_registrations';
        } else if (role === 'TURF_OWNER') {
            tableName = 'turf_owner_registrations';
        } else if (role === 'TOURNAMENT_ORGANIZER') {
            tableName = 'organizer_registrations';
        } else {
            // For admin/referee or other roles not strictly requiring these tables yet.
            res.json({
                registrationComplete: true,
                registrationStatus: 'APPROVED'
            });
            return;
        }

        const result = await pool.query(
            `SELECT registration_status FROM ${tableName} WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.json({
                registrationComplete: false,
                registrationStatus: 'INCOMPLETE'
            });
        } else {
            const status = result.rows[0].registration_status;
            res.json({
                registrationComplete: status === 'APPROVED' || status === 'SUBMITTED',
                registrationStatus: status
            });
        }
    } catch (e: any) {
        console.error('Error fetching registration status:', e);
        res.status(500).json({ error: 'Failed to fetch registration status' });
    }
});

export default router;
