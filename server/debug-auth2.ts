import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth2() {
    try {
        console.log("\nChecking all auth.users:");
        const users = await pool.query(`SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5`);
        console.log(users.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth2();
