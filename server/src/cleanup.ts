import cron from 'node-cron';
import pool from './db';
import { createNotification } from './services/notifications';

// Run every 60 seconds
cron.schedule('* * * * *', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cleanup pending bookings older than 15 minutes to avoid deadlocks with payment logic 
    // which locks bookings before slots natively.
    const expiredBookingsResult = await client.query(`
          SELECT id, slot_id, user_id FROM bookings 
          WHERE status = 'pending' 
          AND created_at < now() - interval '15 minutes' 
          FOR UPDATE SKIP LOCKED
        `);

    if (expiredBookingsResult.rows.length > 0) {
      const bookingIds = expiredBookingsResult.rows.map((r: any) => r.id);
      const slotIds = expiredBookingsResult.rows.map((r: any) => r.slot_id);

      // Mark bookings as cancelled
      await client.query(`
              UPDATE bookings 
              SET status = 'cancelled' 
              WHERE id = ANY($1)
            `, [bookingIds]);

      // Release slots back to available (lock implicitly handled natively by SQL engine order)
      await client.query(`
              UPDATE slots 
              SET status = 'available', updated_at = now()
              WHERE id = ANY($1) AND status = 'held'
            `, [slotIds]);

      // Expire any pending booking contributions
      await client.query(`
              UPDATE booking_contributions
              SET status = 'expired'
              WHERE booking_id = ANY($1) AND status = 'pending'
            `, [bookingIds]);

      // Expire any pending payments bound to it
      await client.query(`
              UPDATE payments
              SET status = 'failed'
              WHERE booking_id = ANY($1) AND status = 'pending'
            `, [bookingIds]);

      for (const r of expiredBookingsResult.rows) {
        await createNotification(client, {
          recipientId: r.user_id,
          type: 'BOOKING_EXPIRED',
          title: 'Payment Expired',
          message: `Your booking was cancelled organically because payment was not dispatched within bounds.`,
          entityType: 'BOOKING',
          entityId: r.id
        });
      }

      console.log(`Cleanup job: Released ${slotIds.length} expired slot(s) and bound contributions.`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cleanup job error:', error);
  } finally {
    client.release();
  }
});
