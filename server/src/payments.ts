import { Router } from 'express';
import { requireAuth } from './auth';
import { razorpay } from './payment';
import crypto from 'crypto';
import pool from './db';
import { createNotification } from './services/notifications';

const router = Router();

// POST /api/v1/payments/create-order
router.post('/create-order', requireAuth, async (req, res) => {
    const { amount, currency = 'INR', receipt, metadata } = req.body;

    try {
        if (metadata?.payment_type === 'SPLIT_ESCROW' && metadata.contribution_id !== 'dummy_c') {
            const contribRes = await pool.query('SELECT status FROM booking_contributions WHERE id = $1', [metadata.contribution_id]);
            if (contribRes.rows.length === 0 || contribRes.rows[0].status !== 'pending') {
                res.status(400).json({ error: 'Payment link expired or already paid.' });
                return;
            }
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt,
            notes: metadata // embed metadata into Razorpay notes for verification callback access
        });

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

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'dummy_key_secret') {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }

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

        let authoritativeMetadata = metadata;
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id') {
            throw new Error('Payment service configuration invalid');
        }

        const fetchedOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (!fetchedOrder) throw new Error('Order lookup failed');
        authoritativeMetadata = fetchedOrder.notes;

        const payment_type = authoritativeMetadata?.payment_type;
        const gross_amount = parseInt(authoritativeMetadata?.gross_amount) || 0; // Paise
        const auth_user = (req as any).user.sub || (req as any).user.id;

        if (payment_type === 'CASUAL_BOOKING') {
            const booking_id = authoritativeMetadata.booking_id;

            if (!booking_id) {
                throw new Error('Valid Booking ID is required.');
            }

            const bookRes = await client.query('SELECT total_amount, slot_id, user_id, status FROM bookings WHERE id = $1 FOR UPDATE', [booking_id]);
            if (bookRes.rows.length === 0) {
                throw new Error('Booking not found');
            }

            if (bookRes.rows[0].user_id !== auth_user) {
                throw new Error('Unauthorized payload manipulation detected');
            }

            if (bookRes.rows[0].status === 'confirmed') {
                await client.query('COMMIT');
                return res.json({ success: true, message: 'Already paid' });
            }

            const totalGross = Number(bookRes.rows[0].total_amount);

            await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking_id]);
            await client.query("UPDATE slots SET status = 'booked' WHERE id = $1", [bookRes.rows[0].slot_id]);

            const platformFee = Math.round(totalGross * 0.05); // 5%
            const netAmount = Math.round(totalGross - platformFee);

            await client.query(
                `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_booking_id, status)
                 VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN courts c ON c.facility_id = f.id JOIN slots s ON s.court_id = c.id WHERE s.id = $1 LIMIT 1), 'TURF_OWNER', $2, $3, $4, $5, 'COMPLETED')`,
                [bookRes.rows[0].slot_id, totalGross, platformFee, netAmount, booking_id]
            );

            await createNotification(client, {
                recipientId: auth_user,
                type: 'BOOKING_CONFIRMED',
                title: 'Booking Confirmed!',
                message: `Your booking was paid successfully.`,
                entityType: 'BOOKING',
                entityId: booking_id
            });
        } else if (payment_type === 'SPLIT_ESCROW') {
            const contribution_id = authoritativeMetadata.contribution_id;
            const booking_id = authoritativeMetadata.booking_id;

            if (!contribution_id || !booking_id) {
                throw new Error('Contribution ID and Booking ID are required.');
            }

            const myContrib = await client.query('SELECT user_id, status FROM booking_contributions WHERE id = $1 FOR UPDATE', [contribution_id]);
            if (myContrib.rows.length === 0) throw new Error('Contribution not found');
            if (myContrib.rows[0].user_id !== auth_user) throw new Error('Unauthorized');

            if (myContrib.rows[0].status === 'paid') {
                await client.query('COMMIT');
                return res.json({ success: true, message: 'Already paid' });
            }

            // Only update this specific contribution
            await client.query("UPDATE booking_contributions SET status = 'paid' WHERE id = $1", [contribution_id]);

            // Check if all contributions are now paid
            const contribRes = await client.query('SELECT status FROM booking_contributions WHERE booking_id = $1 FOR UPDATE', [booking_id]);
            const allPaid = contribRes.rows.every(c => c.status === 'paid');

            if (allPaid) {
                const totalGross = parseFloat(authoritativeMetadata.total_gross_rupees) * 100 || 0;
                const platform_fee = Math.round(totalGross * 0.05);
                const net_amount = totalGross - platform_fee;

                const bRes2 = await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING slot_id", [booking_id]);
                if (bRes2.rows.length) {
                    await client.query("UPDATE slots SET status = 'booked', updated_at = now() WHERE id = $1", [bRes2.rows[0].slot_id]);

                    await client.query(
                        `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_booking_id, status)
                        VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN courts c ON c.facility_id = f.id JOIN slots s ON s.court_id = c.id WHERE s.id = $1 LIMIT 1), 'TURF_OWNER', $2, $3, $4, $5, 'COMPLETED')`,
                        [bRes2.rows[0].slot_id, totalGross, platform_fee, net_amount, booking_id]
                    );

                    await createNotification(client, {
                        recipientId: auth_user,
                        type: 'BOOKING_CONFIRMED',
                        title: 'Split booking fully paid!',
                        message: `Your grouped booking successfully passed escrow and is locked natively.`,
                        entityType: 'BOOKING',
                        entityId: booking_id
                    });
                }
            }
        } else if (payment_type === 'VENUE_LEASE') {
            const lease_id = authoritativeMetadata.lease_id;
            if (!lease_id) throw new Error('Lease ID is required.');

            const platform_fee = Math.round(gross_amount * 0.08); // 8% commision
            const net_amount = gross_amount - platform_fee;

            await client.query("UPDATE venue_lease_requests SET status = 'APPROVED' WHERE id = $1", [lease_id]);

            await client.query(
                `INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, status)
                 VALUES ('BOOKING', (SELECT owner_id FROM facilities f JOIN venue_lease_requests vlr ON vlr.facility_id = f.id WHERE vlr.id = $1), 'TURF_OWNER', $2, $3, $4, 'COMPLETED')`,
                [lease_id, gross_amount, platform_fee, net_amount]
            );
        } else if (payment_type === 'TOURNAMENT_ENTRY') {
            const tournament_id = authoritativeMetadata.tournament_id;
            const entry_id = authoritativeMetadata.entry_id;

            if (!tournament_id || !entry_id) throw new Error('Tournament ID and Entry ID are required.');
            const platform_fee = Math.round(gross_amount * 0.10); // 10% commission
            const net_amount = gross_amount - platform_fee;

            // Update entry fee conditionally ignoring errors gracefully
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
        console.error('Payment capture error:', e);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

export default router;
