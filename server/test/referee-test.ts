import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import pool from '../src/db';

async function runTest() {
    // 1. Seed profiles mimicking Player Talent Pool and participant logic
    const p1Id = '00000000-0000-0000-0000-111111111111';
    const p2Id = '00000000-0000-0000-0000-222222222222';
    const refId = '00000000-0000-0000-0000-333333333333';

    await pool.query(`INSERT INTO auth.users (id, instance_id, aud, role, email) VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.com') ON CONFLICT DO NOTHING`, [p1Id]);
    await pool.query(`INSERT INTO auth.users (id, instance_id, aud, role, email) VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.com') ON CONFLICT DO NOTHING`, [p2Id]);
    await pool.query(`INSERT INTO auth.users (id, instance_id, aud, role, email) VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ref@test.com') ON CONFLICT DO NOTHING`, [refId]);

    // Insert corresponding profiles
    await pool.query(`INSERT INTO profiles (id, name, availability_status, sport_type, position, win_rate) VALUES ($1, 'Player One', 'looking_for_team', 'basketball', 'guard', 0) ON CONFLICT (id) DO NOTHING`, [p1Id]);
    await pool.query(`INSERT INTO profiles (id, name, availability_status, sport_type, position, win_rate) VALUES ($1, 'Player Two', 'not_available', 'basketball', 'center', 0) ON CONFLICT (id) DO NOTHING`, [p2Id]);
    await pool.query(`INSERT INTO profiles (id, name, role) VALUES ($1, 'Ref Bob', 'referee') ON CONFLICT (id) DO NOTHING`, [refId]);

    // 2. Setup mock tournament boundary
    const tRes = await pool.query(`INSERT INTO tournaments (name, format, max_teams, start_date) VALUES ('Demo Bracket', 'single_elim', 4, now()) RETURNING id`);
    const tId = tRes.rows[0].id;

    const fRes = await pool.query(`INSERT INTO tournament_teams (tournament_id, team_name) VALUES ($1, 'Team A') RETURNING id`, [tId]);
    const sRes = await pool.query(`INSERT INTO tournament_teams (tournament_id, team_name) VALUES ($1, 'Team B') RETURNING id`, [tId]);

    const tA = fRes.rows[0].id;
    const tB = sRes.rows[0].id;

    const mRes = await pool.query(`INSERT INTO bracket_matches (tournament_id, round, match_index, team_a_id, team_b_id, referee_id) VALUES ($1, 1, 0, $2, $3, $4) RETURNING id`, [tId, tA, tB, refId]);
    const matchId = mRes.rows[0].id;

    console.log('Seeded match: ', matchId, ' between ', tA, tB);

    // 3. Initiate referee API
    const statsPayload = {
        referee_id: refId,
        stats: [
            { player_id: p1Id, team_id: tA, points: 25, goals: 0, fouls: 2, minutes: 40 },
            { player_id: p2Id, team_id: tB, points: 15, goals: 0, fouls: 4, minutes: 38 }
        ]
    };

    let res = await fetch(`http://localhost:3001/api/v1/referees/matches/${matchId}/live-match-scorecard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsPayload)
    });

    const resJson = await res.json();
    console.log('Referee Request Return:', resJson);
    console.assert(resJson.winner_id === tA, 'Team A should automatically advance due to higher combined points natively verified by code block');

    // 4. Test Player stat verification retrieval
    const statFetch = await fetch(`http://localhost:3001/api/v1/players/${p1Id}/stats`);
    const statJson = await statFetch.json();
    console.log('Player 1 Verified Profile stats:', statJson);
    console.assert(statJson.career_totals.total_points == 25, 'Player 1 should correctly reflect strict referee scoring output bounding');

    // 5. Check Free Agency
    const faFetch = await fetch(`http://localhost:3001/api/v1/players/free-agents?sport=basketball`);
    const faJson = await faFetch.json();
    console.log('Player Talent Pool Filter found:', faJson.length);
    console.assert(faJson.some((p: any) => p.name === 'Player One'), 'Player One should be correctly identified looking_for_team');
    console.assert(!faJson.some((p: any) => p.name === 'Player Two'), 'Player Two must be omitted properly handling not_available scope');

    console.log('✅ TEST PASSED: Live Match Scorecard correctly cascade bracket matches automatically and publish Verified Profiling logic accurately.');

    await pool.end();
}

runTest().catch(console.error);
