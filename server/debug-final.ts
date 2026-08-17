import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth5() {
    try {
        console.log("Looking for specific UUID in auth.users");

        const user = await pool.query(`SELECT id, email FROM auth.users WHERE id = 'e2adebe0-afff-423a-9369-1edb653ad019'`);
        if (user.rows.length > 0) {
            console.log("MATCH FOUND!", user.rows[0]);
        } else {
            console.log("No match found for 'e2adebe0-afff-423a-9369-1edb653ad019'");

            // Try looking for what we found earlier (a0)
            const fallback = await pool.query(`SELECT id, email FROM auth.users WHERE id = 'e2adeba0-afff-423a-9369-1edb653ad019'`);
            if (fallback.rows.length > 0) {
                console.log("Wait, we found a0 variant:", fallback.rows[0]);
            }
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugAuth5();
