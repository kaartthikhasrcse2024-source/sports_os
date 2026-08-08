import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import pool from './db';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const groupBookingQueue = new Queue('GroupBookingQueue', { connection });

// Worker that checks group booking status after timeout
export const groupBookingWorker = new Worker(
    'GroupBookingQueue',
    async (job: Job) => {
        const { booking_id } = job.data;
        const client = await pool.connect();
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

            const allPaid = contributions.every((c: any) => c.status === 'paid');

            if (allPaid) {
                await client.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking_id]);
                await client.query("UPDATE slots SET status = 'booked', updated_at = now() WHERE id = $1", [booking.slot_id]);
                console.log(`Booking ${booking_id} confirmed by worker.`);
            } else {
                // Cancel the booking and release slot
                await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking_id]);
                await client.query("UPDATE slots SET status = 'available', updated_at = now() WHERE id = $1", [booking.slot_id]);

                // Expire remaining unpaid contributions
                await client.query("UPDATE booking_contributions SET status = 'expired' WHERE booking_id = $1 AND status = 'pending'", [booking_id]);
                console.log(`Booking ${booking_id} cancelled by worker due to partial payment.`);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Group booking worker error:', error);
            throw error;
        } finally {
            client.release();
        }
    },
    { connection }
);

groupBookingWorker.on('completed', job => {
    console.log(`Job ${job.id} completed!`);
});

groupBookingWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});
