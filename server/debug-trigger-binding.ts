import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugTriggerBinding() {
    try {
        console.log("Checking triggers on auth.users:");
        const res = await pool.query(`
            SELECT tgname, tgenabled, relname
            FROM pg_trigger
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
            WHERE relname = 'users'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugTriggerBinding();
