import fs from 'fs';
import path from 'path';
import pool from './src/db';

async function runLeaseMigration() {
    console.log('Applying Lease Schema Migrations...');
    try {
        const schemaPath = path.join(__dirname, '../lease-schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Lease Schema migration applied successfully.');
    } catch (error) {
        console.error('Error applying Lease schema:', error);
    } finally {
        pool.end();
    }
}
runLeaseMigration();
