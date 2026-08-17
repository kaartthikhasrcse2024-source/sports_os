const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgres://postgres.aaytyaykndhxxhncculk:33Xem%2B%24wy%409g%402H@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS double_booking_guard ON bookings (slot_id) WHERE status IN ('pending', 'confirmed')");
    console.log('Index created');
    pool.end();
}
run();
