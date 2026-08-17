import pool from './src/db';

async function migrate() {
    console.log('Initiating Phase 4F Tournament Migration...');

    try {
        await pool.query('BEGIN');

        // Add robust relationships enforcing tournament structural security safely
        await pool.query(`
            ALTER TABLE tournaments 
            ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id),
            ADD COLUMN IF NOT EXISTS status text DEFAULT 'OPEN';
        `);

        console.log('Successfully completed Schema updates natively attaching Organizer constraints.');

        await pool.query('COMMIT');
    } catch (e) {
        console.error('Migration failed critically:', e);
        await pool.query('ROLLBACK');
    } finally {
        await pool.end();
    }
}

migrate();
