import fs from 'fs';
import path from 'path';
import pool from './db';

async function runYieldMigration() {
    const schemaPath = path.join(__dirname, '../../yield-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running Yield Pricing Migration...');
    try {
        await pool.query(sql);
        console.log('Yield Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

runYieldMigration();
