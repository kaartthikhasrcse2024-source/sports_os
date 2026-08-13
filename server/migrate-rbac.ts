import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import pool from './src/db';

config({ path: resolve(process.cwd(), '../.env') });

async function runMigration() {
    try {
        console.log('Reading RBAC schema...');
        const sql = readFileSync(resolve(process.cwd(), '../rbac-schema.sql'), 'utf-8');

        console.log('Applying natively via pg pool to bypass localhost fetch...');

        await pool.query(sql);
        console.log('✅ Migration applied successfully directly via postgres pool.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runMigration();
