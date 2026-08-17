const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
    connectionString: 'postgres://postgres.aaytyaykndhxxhncculk:33Xem%2B%24wy%409g%402H@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
    const indexes = await pool.query("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = 'bookings'");
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings'");
    const slots = await pool.query("SELECT DISTINCT status FROM slots");
    const bookings = await pool.query("SELECT DISTINCT status FROM bookings");

    const output = {
        indexes: indexes.rows,
        cols: cols.rows,
        slots: slots.rows,
        bookings: bookings.rows
    };
    fs.writeFileSync('db_stats.json', JSON.stringify(output, null, 2));
    pool.end();
}
run();
