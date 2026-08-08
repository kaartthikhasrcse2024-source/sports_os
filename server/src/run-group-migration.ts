import fs from 'fs';
import path from 'path';
import pool from './db';

async function runMigration() {
    const schemaPath = path.join(__dirname, '../../group-booking-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running group booking migration...');
    try {
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

runMigration();
