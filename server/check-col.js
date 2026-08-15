const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    try {
        const res = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='facilities'`);
        res.rows.forEach(r => console.log(r.column_name, r.data_type, r.is_nullable));
    } catch (e) { console.error(e); } finally { pool.end(); }
}
check();
