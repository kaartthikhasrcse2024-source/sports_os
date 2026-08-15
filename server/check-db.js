const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function checkTables() {
    try {
        const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
        const tables = res.rows.map(r => r.table_name);
        console.log("Tables:", JSON.stringify(tables, null, 2));

        if (tables.includes('facilities')) {
            const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='facilities'`);
            console.log("Facilities Columns:", JSON.stringify(cols.rows.map(r => r.column_name)));
        }
    } catch (e) { console.error(e); } finally { pool.end(); }
}
checkTables();
