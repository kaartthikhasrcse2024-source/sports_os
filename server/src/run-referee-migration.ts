import fs from 'fs';
import path from 'path';
import pool from './db';

async function runRefereeMigration() {
    const schemaPath = path.join(__dirname, '../../referee-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running Referee Migration...');
    try {
        await pool.query(sql);
        console.log('Referee Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

runRefereeMigration();
