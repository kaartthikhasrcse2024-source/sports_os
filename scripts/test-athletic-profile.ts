import pool from '../server/src/db';

async function testAthleticProfile() {
    console.log('[TEST] Starting Athletic Profile tests...');

    // 1. We mock a user directly in the database 
    const mockId = '00000000-0000-0000-0000-000000000001';
    try {
        await pool.query(`INSERT INTO profiles (id, full_name, role) VALUES ($1, 'Test Athlete', 'player') ON CONFLICT (id) DO NOTHING`, [mockId]);

        // 2. Insert/Update user's physical profile directly 
        console.log('[TEST] Updating physical profile...');
        await pool.query(`
            INSERT INTO athletic_profiles (
                id, height_cm, weight_kg, primary_position, playing_status, open_for_scouting, overall_athletic_score
            ) VALUES ($1, 185, 80, 'Forward', 'free_agent', true, 9.5)
            ON CONFLICT (id) DO UPDATE SET 
                height_cm = EXCLUDED.height_cm,
                primary_position = EXCLUDED.primary_position
        `, [mockId]);

        // 3. Verify it persists
        const res = await pool.query('SELECT * FROM athletic_profiles WHERE id = $1', [mockId]);
        if (res.rows[0].height_cm === 185) {
            console.log('[TEST] Profile persisting correctly.');
        } else {
            console.error('[TEST] Profile persistence failed.');
        }

        // 4. Test scout search query
        console.log('[TEST] Executing scout search...');
        const fetchRes = await fetch('http://localhost:3001/api/v1/scout/players?height_cm_min=180&position=Forward');
        const fetchJson = await fetchRes.json();

        if (Array.isArray(fetchJson) && fetchJson.length > 0) {
            console.log('[TEST] Scout search query returned results!', fetchJson[0].name);
        } else {
            console.error('[TEST] Scout search query did not return expected results (check if server is running).', fetchJson);
        }

    } catch (e) {
        console.error('[TEST ERROR]', e);
    } finally {
        // Cleanup mock
        await pool.query('DELETE FROM profiles WHERE id = $1', [mockId]);
        process.exit();
    }
}

testAthleticProfile();
