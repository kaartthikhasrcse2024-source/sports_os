import { Router } from 'express';
import { requireAuth } from './auth';
import { razorpay } from './payment';
import crypto from 'crypto';
import pool from './db';

const router = Router();

// POST /api/v1/payments/create-order
router.post('/create-order', requireAuth, async (req, res) => {
    const { amount, currency = 'INR', receipt, metadata } = req.body;

    try {
        if (metadata?.payment_type === 'SPLIT_ESCROW') {
            const contribRes = await pool.query('SELECT status FROM booking_contributions WHERE id = $1', [metadata.contribution_id]);
            if (contribRes.rows.length === 0 || contribRes.rows[0].status !== 'pending') {
                res.status(400).json({ error: 'Payment link expired or already paid.' });
                return;
            }
        }

        let order;
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id') {
            order = { id: 'order_mock_' + Date.now(), amount: Math.round(amount * 100) };
        } else {
            order = await razorpay.orders.create({
                amount: Math.round(amount * 100), // convert to paise
                currency,
                receipt,
                notes: metadata // embed metadata into Razorpay notes for verification callback access
            });
        }

        res.json({
            order_id: order.id,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (e: any) {
        console.error('Razorpay create-order error:', e);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// POST /api/v1/payments/verify-signature
router.post('/verify-signature', requireAuth, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

    const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        res.status(400).json({ error: 'Payment verification failed: Signature mismatch.' });
        return;
    }

    // Payment is authentic; process business logic!
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const payment_type = metadata?.payment_type;
        const gross_amount = parseInt(metadata?.gross_amount) || 0; // Paise
        const user_id = metadata?.user_id;

        if (payment_type === 'CASUAL_BOOKING') {
            const booking_id = metadata.booking_id;

            const bookRes = await client.query('SELECT total_amount, slot_id FROM bookings WHERE id = $1', [booking_id]);
            const totalGross = Number(bookRes.rows[0].total_amount);

            await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking_id]);
            await client.query("UPDATE slots SET status = 'booked' WHERE id = $1", [bookRes.rows[0].slot_id]);

            const platformFee = Math.round(totalGross * 0.05); // 5%
            const netAmount = Math.round(totalGross - platformFee);

            await client.query(
                `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_booking_id, status)
                 VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN courts c ON c.facility_id = f.id JOIN slots s ON s.court_id = c.id JOIN bookings b ON b.slot_id = s.id WHERE b.id = $1 LIMIT 1), 'TURF_OWNER', $2, $3, $4, $1, 'COMPLETED')`,
                [booking_id, totalGross, platformFee, netAmount]
            );
        } else if (payment_type === 'SPLIT_ESCROW') {
            const contribution_id = metadata.contribution_id;
            const booking_id = metadata.booking_id;

            // Only update this specific contribution
            await client.query("UPDATE booking_contributions SET status = 'paid' WHERE id = $1", [contribution_id]);

            // Check if all contributions are now paid
            const contribRes = await client.query('SELECT status FROM booking_contributions WHERE booking_id = $1 FOR UPDATE', [booking_id]);
            const allPaid = contribRes.rows.every(c => c.status === 'paid');

            if (allPaid) {
                const totalGross = parseFloat(metadata.total_gross_rupees) * 100 || 0;
                const platform_fee = Math.round(totalGross * 0.05);
                const net_amount = totalGross - platform_fee;

                const bRes2 = await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING slot_id", [booking_id]);
                if (bRes2.rows.length) {
                    await client.query("UPDATE slots SET status = 'booked', updated_at = now() WHERE id = $1", [bRes2.rows[0].slot_id]);
                }

                await client.query(
                    `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_booking_id, status)
                    VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN courts c ON c.facility_id = f.id JOIN slots s ON s.court_id = c.id JOIN bookings b ON b.slot_id = s.id WHERE b.id = $1 LIMIT 1), 'TURF_OWNER', $2, $3, $4, $1, 'COMPLETED')`,
                    [booking_id, totalGross, platform_fee, net_amount]
                );
            }
        } else if (payment_type === 'VENUE_LEASE') {
            const lease_id = metadata.lease_id;
            const platform_fee = Math.round(gross_amount * 0.08); // 8% commision
            const net_amount = gross_amount - platform_fee;

            await client.query("UPDATE venue_lease_requests SET status = 'APPROVED' WHERE id = $1", [lease_id]);

            await client.query(
                `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, status)
                 VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN venue_lease_requests vlr ON vlr.facility_id = f.id WHERE vlr.id = $1), 'TURF_OWNER', $2, $3, $4, 'COMPLETED')`,
                [lease_id, gross_amount, platform_fee, net_amount]
            );
        } else if (payment_type === 'TOURNAMENT_ENTRY') {
            const tournament_id = metadata.tournament_id;
            const entry_id = metadata.entry_id;

            const platform_fee = Math.round(gross_amount * 0.10); // 10% commission
            const net_amount = gross_amount - platform_fee;

            // Mock update entry fee
            await client.query("UPDATE tournament_registrations SET status = 'CONFIRMED' WHERE id = $1", [entry_id]).catch(() => { });

            await client.query(
                `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_tournament_id, status)
                 VALUES ('TOURNAMENT_ENTRY', (SELECT owner_id FROM facilities f JOIN tournaments t ON t.facility_id = f.id WHERE t.id = $1 LIMIT 1), 'TOURNAMENT_ORGANIZER', $2, $3, $4, $1, 'COMPLETED')`,
                [tournament_id, gross_amount, platform_fee, net_amount]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Payment successfully captured and distributed' });
    } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message || 'Internal business logic error during payment capture.' });
    } finally {
        client.release();
    }
});

export default router;
