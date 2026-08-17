import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth4() {
    try {
        const check = await pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('role', 'user_role', 'name', 'full_name')`);
        console.table(check.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth4();
