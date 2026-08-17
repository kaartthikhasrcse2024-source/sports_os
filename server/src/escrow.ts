import { Router } from 'express';
import pool from './db';
import { groupBookingQueue } from './queue';
import { requireAuth, requireRole } from './auth';

const router = Router();

router.post('/split-pay', requireAuth, requireRole(['PLAYER']), async (req, res) => {
    const { slot_id } = req.body;
    if (!slot_id) {
        res.status(400).json({ error: 'slot_id is required' });
        return;
    }

    try {
        // Create hold
        await pool.query("UPDATE slots SET status = 'held' WHERE id = $1", [slot_id]);

        // Add to bullmq queue for 15 minute delay
        await groupBookingQueue.add('checkSplitPay', { slot_id: slot_id }, { delay: 15 * 60 * 1000 });

        res.json({ success: true, message: 'Slot held. 15 minute timer started in queue.' });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Simulation route to mark the rest of the payments and settle it
router.post('/split-pay/settle', requireAuth, requireRole(['PLAYER']), async (req, res) => {
    const { slot_id } = req.body;
    if (!slot_id) {
        res.status(400).json({ error: 'slot_id is required' });
        return;
    }
    try {
        await pool.query("UPDATE slots SET status = 'booked' WHERE id = $1", [slot_id]);
        res.json({ success: true, message: 'Slot fully paid and booked.' });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
