import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth() {
    try {
        const userId = 'e2adebe0-afff-423a-9369-1edb653ad019';
        console.log("\nChecking auth.users:");
        const user = await pool.query(`SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = $1`, [userId]);
        console.log(user.rows[0]);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth();
