"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("./db"));
// Run every 60 seconds
node_cron_1.default.schedule('* * * * *', async () => {
    const client = await db_1.default.connect();
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Cleanup job error:', error);
    }
    finally {
        client.release();
    }
});
//# sourceMappingURL=cleanup.js.map