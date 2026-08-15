const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function runQuery() {
    try {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='profiles'`);
        fs.writeFileSync('cols.json', JSON.stringify({ columns: res.rows.map(r => r.column_name) }));
    } catch (e) {
        fs.writeFileSync('cols.json', JSON.stringify({ error: e.message }));
    } finally {
        pool.end();
    }
}
runQuery();
