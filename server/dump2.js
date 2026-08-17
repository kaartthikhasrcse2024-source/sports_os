const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
    const res = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE '%registration%' ORDER BY table_name");
    const fs = require('fs');
    fs.writeFileSync('tables.json', JSON.stringify(res.rows, null, 2));
    pool.end();
})();
