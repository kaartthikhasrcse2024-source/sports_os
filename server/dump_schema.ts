import pool from './src/db';

async function describeTable(tableName: string) {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `, [tableName]);
        console.log(`\nTable Schema for ${tableName}:`);
        console.table(res.rows);
    } catch (e) {
        console.error(`Error describing ${tableName}`, e);
    }
}

async function main() {
    await describeTable('player_registrations');
    await describeTable('turf_owner_registrations');
    await describeTable('organizer_registrations');
    await describeTable('profiles');
    pool.end();
}

main();
