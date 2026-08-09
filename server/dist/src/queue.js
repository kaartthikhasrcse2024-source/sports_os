"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBookingWorker = exports.groupBookingQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const db_1 = __importDefault(require("./db"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});
exports.groupBookingQueue = new bullmq_1.Queue('GroupBookingQueue', { connection });
// Worker that checks group booking status after timeout
exports.groupBookingWorker = new bullmq_1.Worker('GroupBookingQueue', async (job) => {
    const { booking_id } = job.data;
    const client = await db_1.default.connect();
    console.log(`Checking group booking completion for ${booking_id}`);
    try {
        await client.query('BEGIN');
        const bookingRes = await client.query('SELECT slot_id, status FROM bookings WHERE id = $1 FOR UPDATE', [booking_id]);
        if (bookingRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return;
        }
        const booking = bookingRes.rows[0];
        if (booking.status !== 'pending') {
            // Already processed
            await client.query('ROLLBACK');
            return;
        }
        const contributionsRes = await client.query('SELECT * FROM booking_contributions WHERE booking_id = $1 FOR UPDATE', [booking_id]);
        const contributions = contributionsRes.rows;
        const allPaid = contributions.every((c) => c.status === 'paid');
        if (allPaid) {
            await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking_id]);
            await client.query("UPDATE slots SET status = 'booked', updated_at = now() WHERE id = $1", [booking.slot_id]);
            console.log(`Booking ${booking_id} confirmed by worker.`);
        }
        else {
            // Cancel the booking and release slot
            await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking_id]);
            await client.query("UPDATE slots SET status = 'available', updated_at = now() WHERE id = $1", [booking.slot_id]);
            // Expire remaining unpaid contributions
            await client.query("UPDATE booking_contributions SET status = 'expired' WHERE booking_id = $1 AND status = 'pending'", [booking_id]);
            console.log(`Booking ${booking_id} cancelled by worker due to partial payment.`);
        }
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Group booking worker error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}, { connection });
exports.groupBookingWorker.on('completed', job => {
    console.log(`Job ${job.id} completed!`);
});
exports.groupBookingWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});
