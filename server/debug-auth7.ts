import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugAuth7() {
    try {
        console.log("Simulating fixed trigger execution logic...");
        await pool.query(`
            INSERT INTO public.profiles (id, full_name, name, user_role, role)
            VALUES (
                'e850b33e-1263-4878-b26f-3a2aed6b7482',
                'Live Test Player',
                'Live Test Player',
                'PLAYER',
                'PLAYER'::user_role
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                user_role = EXCLUDED.user_role;
        `);
        console.log("Insert SUCCEEDED. What?");
    } catch (e) {
        console.error("Insert FAILED:");
        console.error(e);
    }
    process.exit(0);
}
debugAuth7();
