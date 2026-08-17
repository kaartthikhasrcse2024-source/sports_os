import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function getTrigger() {
    try {
        const query = await pool.query(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user'`);
        console.log(query.rows[0].pg_get_functiondef);
    } catch (e) { console.error(e); }
    process.exit(0);
}
getTrigger();
