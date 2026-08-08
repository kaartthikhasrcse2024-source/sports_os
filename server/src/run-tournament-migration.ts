import fs from 'fs';
import path from 'path';
import pool from './db';

async function runTournamentMigration() {
    const schemaPath = path.join(__dirname, '../../tournament-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running Tournament migration...');
    try {
        await pool.query(sql);
        console.log('Tournament Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

runTournamentMigration();
