import cron from 'node-cron';
import pool from './db';

// Run every 60 seconds
cron.schedule('* * * * *', async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find slots held for more than 15 minutes and lock them
        const heldSlotsResult = await client.query(`
      SELECT id FROM slots 
      WHERE status = 'held' 
      AND updated_at < now() - interval '15 minutes' 
      FOR UPDATE SKIP LOCKED
    `);

        if (heldSlotsResult.rows.length > 0) {
            const slotIds = heldSlotsResult.rows.map(r => r.id);

            // Cancel associated pending bookings
            await client.query(`
        UPDATE bookings 
        SET status = 'cancelled' 
        WHERE slot_id = ANY($1) AND status = 'pending'
      `, [slotIds]);

            // Release slots back to available
            await client.query(`
        UPDATE slots 
        SET status = 'available', updated_at = now()
        WHERE id = ANY($1)
      `, [slotIds]);

            console.log(`Cleanup job: released ${slotIds.length} expired held slot(s).`);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cleanup job error:', error);
    } finally {
        client.release();
    }
});
