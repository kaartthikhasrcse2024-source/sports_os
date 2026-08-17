const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function describeTable(tableName) {
    let result = {};
    try {
        const cols = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position;", [tableName]);
        result.columns = cols.rows;

        const constraints = await pool.query("SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = $1::regclass;", [tableName]);
        result.constraints = constraints.rows;

        const indexes = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = $1;", [tableName]);
        result.indexes = indexes.rows;
    } catch (e) {
        result.error = e.message;
    }
    return result;
}

async function main() {
    let data = {};
    data['player_registrations'] = await describeTable('player_registrations');
    data['turf_owner_registrations'] = await describeTable('turf_owner_registrations');
    data['organizer_registrations'] = await describeTable('organizer_registrations');

    const enums = await pool.query("SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('user_role', 'verification_state', 'registration_status');");
    data['enums'] = enums.rows;

    fs.writeFileSync('db_schema.json', JSON.stringify(data, null, 2));
    pool.end();
}

main();
