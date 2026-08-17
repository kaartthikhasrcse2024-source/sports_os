import pool from './src/db';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS tournament_team_players (
                team_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
                player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
                joined_at timestamp DEFAULT now(),
                status text DEFAULT 'ACTIVE',
                PRIMARY KEY (team_id, player_id)
            );
        `;
        await pool.query(sql);
        console.log("Junction table created successfully.");

        // Also append it to tournament-schema.sql to preserve intent
        const schemaPath = path.join(__dirname, '../tournament-schema.sql');
        fs.appendFileSync(schemaPath, "\n\n" + sql);
    } catch (e: any) {
        console.error("Migration Error:", e.message);
    }
    process.exit();
}
run();
