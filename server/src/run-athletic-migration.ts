import fs from 'fs';
import path from 'path';
import pool from './db';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running athletic schema migration...');
        const schemaPath = path.join(__dirname, '../../athletic-schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('Athletic schema migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Athletic schema migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

runMigration();
