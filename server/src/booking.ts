import { Router } from 'express';
import pool from './db';
import { requireAuth } from './auth';

const router = Router();

// POST /api/v1/bookings/reserve
router.post('/reserve', requireAuth, async (req, res) => {
    const { slot_id, user_id, amount } = req.body;
    if (!slot_id || !user_id || amount === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const slotResult = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slot_id]);
        if (slotResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'SLOT_NOT_FOUND' });
            return;
        }

        const slot = slotResult.rows[0];
        if (slot.status !== 'available') {
            await client.query('ROLLBACK');
            res.status(409).json({ error: 'SLOT_NOT_AVAILABLE' });
            return;
        }

        // Insert pending booking
        const bookingResult = await client.query(
            'INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, $3, $4) RETURNING id',
            [slot_id, user_id, 'pending', amount]
        );
        const booking_id = bookingResult.rows[0].id;

        // Insert pending payment
        const paymentResult = await client.query(
            'INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, $3) RETURNING id',
            [booking_id, amount, 'pending']
        );
        const payment_id = paymentResult.rows[0].id;

        // Update slot status to held
        await client.query(
            "UPDATE slots SET status = 'held', updated_at = now() WHERE id = $1",
            [slot_id]
        );

        await client.query('COMMIT');
        res.status(201).json({
            booking_id,
            payment_id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reservation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// POST /api/v1/bookings/:id/payments/:paymentId/confirm
router.post('/:id/payments/:paymentId/confirm', requireAuth, async (req, res) => {
    const { id: booking_id, paymentId: payment_id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock payment and booking
        const paymentResult = await client.query('SELECT * FROM payments WHERE id = $1 AND booking_id = $2 FOR UPDATE', [payment_id, booking_id]);
        if (paymentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });
            return;
        }

        const bookingResult = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [booking_id]);
        const booking = bookingResult.rows[0];

        // Mark payment paid
        await client.query("UPDATE payments SET status = 'paid' WHERE id = $1", [payment_id]);

        // Check total payments vs booking total_amount (simplification: assume 1 payment fully pays)
        // Here we update booking and slot unconditionally as requested
        await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking_id]);
        await client.query("UPDATE slots SET status = 'booked', updated_at = now() WHERE id = $1", [booking.slot_id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            booking_id,
            payment_id,
            status: 'confirmed'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Confirmation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

import { groupBookingQueue } from './queue';
import { razorpay } from './payment';

// POST /api/v1/bookings/group-reserve
router.post('/group-reserve', requireAuth, async (req, res) => {
    const { slot_id, user_id, amount, contributor_ids } = req.body;
    if (!slot_id || !user_id || amount === undefined || !contributor_ids || !contributor_ids.length) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const slotResult = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slot_id]);
        if (slotResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'SLOT_NOT_FOUND' });
            return;
        }

        const slot = slotResult.rows[0];
        if (slot.status !== 'available') {
            await client.query('ROLLBACK');
            res.status(409).json({ error: 'SLOT_NOT_AVAILABLE' });
            return;
        }

        const bookingResult = await client.query(
            'INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, $3, $4) RETURNING id',
            [slot_id, user_id, 'pending', amount]
        );
        const booking_id = bookingResult.rows[0].id;

        const splitAmount = amount / contributor_ids.length;
        const insertPromises = contributor_ids.map((cid: string) => {
            return client.query(
                `INSERT INTO booking_contributions (booking_id, user_id, amount_owed, status) VALUES ($1, $2, $3, 'pending')`,
                [booking_id, cid, splitAmount]
            );
        });
        await Promise.all(insertPromises);

        await client.query(
            "UPDATE slots SET status = 'held', updated_at = now() WHERE id = $1",
            [slot_id]
        );

        await client.query('COMMIT');

        // Schedule cleanup after 30 seconds
        await groupBookingQueue.add('checkGroupPayment', { booking_id }, { delay: 30000 });

        res.status(201).json({
            booking_id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Group reserve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// POST /api/v1/bookings/contributions/:id/checkout
router.post('/contributions/:id/checkout', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const contributionRes = await pool.query('SELECT * FROM booking_contributions WHERE id = $1', [id]);
        if (contributionRes.rows.length === 0) {
            res.status(404).json({ error: 'Contribution not found' });
            return;
        }

        const contribution = contributionRes.rows[0];
        if (contribution.status !== 'pending') {
            res.status(400).json({ error: 'Contribution is already paid or expired' });
            return;
        }

        const order = await razorpay.orders.create({
            amount: Math.round(contribution.amount_owed * 100),
            currency: 'INR'
        });

        res.json({ order_id: order.id, amount: contribution.amount_owed });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/v1/bookings/contributions/:id/verify
router.post('/contributions/:id/verify', requireAuth, async (req, res) => {
    const { id } = req.params;
    // In production, verify razorpay_signature here
    try {
        await pool.query("UPDATE booking_contributions SET status = 'paid' WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

import { calculateYieldPrice, fetchFacilityWeather } from './pricing';

// GET /api/v1/bookings/slots
router.get('/slots', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, c.facility_id, f.base_price_per_hour, f.peak_hour_multiplier, f.weekend_multiplier, f.is_outdoor, f.lat, f.lng
            FROM slots s
            JOIN courts c ON s.court_id = c.id
            JOIN facilities f ON c.facility_id = f.id
            WHERE s.status = 'available'
            ORDER BY s.start_time ASC
            LIMIT 10
        `);

        // Resolve weather states explicitly buffering fetches
        const weatherCache: Record<string, any> = {};

        const formatted = await Promise.all(result.rows.map(async (row) => {
            const facId = row.facility_id;
            let condition = weatherCache[facId];
            if (condition === undefined && row.lat && row.lng) {
                condition = await fetchFacilityWeather(row.lat, row.lng) || null;
                weatherCache[facId] = condition;
            } else if (condition === undefined) {
                condition = null;
                weatherCache[facId] = null;
            }

            const yieldDetail = calculateYieldPrice(
                row.start_time,
                Number(row.base_price_per_hour) || 1500,
                Number(row.peak_hour_multiplier) || 1.2,
                Number(row.weekend_multiplier) || 1.15,
                row.is_outdoor,
                condition
            );

            return {
                ...row,
                yield_price: yieldDetail
            };
        }));

        res.json(formatted);
    } catch (e: any) {
        console.error('Yield Evaluation failure:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
