import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function check() {
    try {
        console.log("Testing insert with PLAYER");
        // We do a mock insert
        await pool.query(`INSERT INTO profiles (id, name, role) VALUES ('00000000-0000-0000-0000-000000000001', 'Test', 'PLAYER'::user_role) ON CONFLICT DO NOTHING`);
        console.log("Insert passed");
    } catch (e) {
        console.error("Insert rejected:");
        console.error(e);
    }

    try {
        const enumCheck = await pool.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'user_role'`);
        console.log("Available Roles in DB:");
        console.dir(enumCheck.rows.map(r => r.enumlabel));
    } catch (e) { console.error(e); }
    process.exit(0);
}
check();
