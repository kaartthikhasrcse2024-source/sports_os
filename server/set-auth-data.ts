import pool from './src/db';

async function setAthleticId() {
    try {
        const players = await pool.query(`SELECT id FROM profiles WHERE user_role = 'PLAYER'`);
        for (const p of players.rows) {
            await pool.query(`
                INSERT INTO athletic_profiles (id, height_cm, weight_kg, dominant_foot_hand, primary_position, playing_status, open_for_scouting)
                VALUES ($1, 180, 75.5, 'right', 'Forward', 'free_agent', true)
                ON CONFLICT (id) DO UPDATE SET 
                    height_cm = 180, weight_kg = 75.5, dominant_foot_hand = 'right', primary_position = 'Forward'
            `, [p.id]);
        }
        console.log(`Set for ${players.rows.length} players!`);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
setAthleticId();
