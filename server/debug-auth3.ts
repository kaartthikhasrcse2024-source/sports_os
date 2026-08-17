import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth3() {
    try {
        const users = await pool.query(`SELECT * FROM profiles WHERE id = 'e2adeba0-afff-423a-9369-1edb653ad019'`);
        console.log(users.rows.length ? "Exists: " + users.rows[0].id + " role: " + users.rows[0].user_role : "Missing");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth3();
