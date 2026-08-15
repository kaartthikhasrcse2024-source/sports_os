const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function populate() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query('UPDATE athletic_profiles SET open_for_scouting = true');
        console.log('Set all athletic_profiles to open_for_scouting = true');
        const res = await client.query('SELECT COUNT(*) FROM athletic_profiles WHERE open_for_scouting = true');
        console.log('Total scoutable players:', res.rows[0].count);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
populate();
