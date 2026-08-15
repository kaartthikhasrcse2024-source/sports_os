import pool from './server/src/db';

async function checkTables() {
    try {
        const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
        console.log("Tables in database:", res.rows.map(r => r.table_name));
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        pool.end();
    }
}
checkTables();
