import { Router } from 'express';
import pool from './db';
import { requireAuth } from './auth';

const router = Router();

// GET / => fetch all sorted organically
router.get('/', requireAuth, async (req, res) => {
    const userId = (req as any).user.sub || (req as any).user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE recipient_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
    const userId = (req as any).user.sub || (req as any).user.id;
    try {
        const result = await pool.query(
            `SELECT count(id) FROM notifications WHERE recipient_id = $1 AND is_read = false`,
            [userId]
        );
        res.json({ unreadCount: parseInt(result.rows[0].count) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
    const userId = (req as any).user.sub || (req as any).user.id;
    const { id } = req.params;
    try {
        // Identity bound natively enforcing isolation mappings against targeted updates
        const result = await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Notification block missing or forbidden' });
        }
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /read-all
router.put('/read-all', requireAuth, async (req, res) => {
    const userId = (req as any).user.sub || (req as any).user.id;
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE recipient_id = $1`,
            [userId]
        );
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
