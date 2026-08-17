import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugProfile() {
    try {
        console.log("Checking columns in profiles table...");
        const columns = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`);
        console.log(columns.rows.map(r => r.column_name));

        const userId = 'e2adebe0-afff-423a-9369-1edb653ad019';
        console.log("\nChecking if profile exists:", userId);
        const user = await pool.query(`SELECT * FROM profiles WHERE id = $1`, [userId]);
        console.log(user.rows.length > 0 ? "Profile exists!" : "PROFILE DOES NOT EXIST.");
        if (user.rows.length > 0) {
            console.log("Profile data:", user.rows[0]);
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugProfile();
