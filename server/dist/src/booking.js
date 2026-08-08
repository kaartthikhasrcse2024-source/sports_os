"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// POST /api/v1/bookings/reserve
router.post('/reserve', auth_1.requireAuth, async (req, res) => {
    const { slot_id, user_id, amount } = req.body;
    if (!slot_id || !user_id || amount === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    const client = await db_1.default.connect();
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
        const bookingResult = await client.query('INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, $3, $4) RETURNING id', [slot_id, user_id, 'pending', amount]);
        const booking_id = bookingResult.rows[0].id;
        // Insert pending payment
        const paymentResult = await client.query('INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, $3) RETURNING id', [booking_id, amount, 'pending']);
        const payment_id = paymentResult.rows[0].id;
        // Update slot status to held
        await client.query("UPDATE slots SET status = 'held', updated_at = now() WHERE id = $1", [slot_id]);
        await client.query('COMMIT');
        res.status(201).json({
            booking_id,
            payment_id
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Reservation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// POST /api/v1/bookings/:id/payments/:paymentId/confirm
router.post('/:id/payments/:paymentId/confirm', auth_1.requireAuth, async (req, res) => {
    const { id: booking_id, paymentId: payment_id } = req.params;
    const client = await db_1.default.connect();
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Confirmation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.default = router;
