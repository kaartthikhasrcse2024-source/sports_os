import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth6() {
    try {
        console.log("Looking for ALL UUIDs starting with e2adeb in auth.users");

        const user = await pool.query(`SELECT id, email FROM auth.users WHERE id::text LIKE 'e2adeb%'`);
        console.log(user.rows);

        console.log("\nLooking for ALL UUIDs starting with e2adeb in profiles");
        const prof = await pool.query(`SELECT id, role, user_role FROM profiles WHERE id::text LIKE 'e2adeb%'`);
        console.log(prof.rows);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth6();
