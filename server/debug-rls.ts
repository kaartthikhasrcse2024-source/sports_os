import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function debugRLS() {
    try {
        console.log("Checking RLS policies for profiles:");
        const rls = await pool.query(`SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles'`);
        console.table(rls.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugRLS();
