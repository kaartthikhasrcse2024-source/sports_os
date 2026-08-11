const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running athletic schema migration...');
        const sql = fs.readFileSync(__dirname + '/athletic-schema.sql', 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('Athletic schema migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Athletic schema migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

runMigration();
