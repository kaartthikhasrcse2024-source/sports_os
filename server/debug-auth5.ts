import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth5() {
    try {
        console.log("Simulating trigger execution logic...");
        // Emulating what happens for TOURNAMENT_ORGANIZER:
        await pool.query(`
            INSERT INTO public.profiles (id, full_name, email, user_role)
            VALUES (
                'e2adeba0-afff-423a-9369-1edb653ad019',
                'jane ',
                'kaartthikhas@gmail.com',
                'TOURNAMENT_ORGANIZER'
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name;
        `);
        console.log("Insert SUCCEEDED. What?");
    } catch (e) {
        console.error("Insert FAILED:");
        console.error(e);
    }
    process.exit(0);
}
debugAuth5();
