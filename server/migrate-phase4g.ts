import pool from './src/db';

async function migrate() {
    console.log('Initiating Phase 4G Notifications Migration...');

    try {
        await pool.query('BEGIN');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                entity_type TEXT,
                entity_id UUID,
                is_read BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            -- Prevent duplicate notification flooding leveraging strict type overlaps mapped to entity constraints
            CREATE UNIQUE INDEX IF NOT EXISTS double_notification_guard 
            ON notifications (recipient_id, type, entity_id) WHERE entity_id IS NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications (recipient_id, is_read);
            CREATE INDEX IF NOT EXISTS idx_notifications_created_time ON notifications (created_at DESC);
        `);

        console.log('Successfully completed Schema updates natively creating Universal Notification limits.');

        await pool.query('COMMIT');
    } catch (e) {
        console.error('Migration failed critically:', e);
        await pool.query('ROLLBACK');
    } finally {
        await pool.end();
    }
}

migrate();
