const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function runQuery() {
    try {
        const query = `SELECT * FROM venue_lease_requests`;
        const res = await pool.query(query);
        fs.writeFileSync('err.json', JSON.stringify({ rows: res.rows }));
    } catch (e) {
        fs.writeFileSync('err.json', JSON.stringify({ error: e.message }));
    } finally {
        pool.end();
    }
}
runQuery();
