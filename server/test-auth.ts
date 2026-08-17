import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import pool from './src/db';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("Starting Auth Integrity Tests...");

    // Create random user email for test
    const randomId = Math.floor(Math.random() * 1000000);
    const testEmail = `test_player_${randomId}@example.com`;
    const password = 'TestPassword123!';

    try {
        console.log(`\nTEST 1: Signup with STRICT 'PLAYER' role...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password,
            options: { data: { full_name: 'Test Player', role: 'PLAYER' } }
        });

        if (signUpError) throw new Error(signUpError.message);
        console.log(`User created. UID: ${signUpData.user?.id}`);

        // Wait 1s for Postgres trigger
        await new Promise(r => setTimeout(r, 1000));

        console.log(`\nTEST 2: Database trigger mapping verification...`);
        const result = await pool.query(`SELECT id, role, name FROM profiles WHERE id = $1`, [signUpData.user?.id]);
        if (result.rows.length === 0) {
            throw new Error(`Orphaned User! Postgres trigger failed to generate profile. Check ENUM mapping.`);
        }
        console.log(`Success! Trigger caught and generated Profile. Profile Role: ${result.rows[0].role}`);

        console.log(`\nTEST 3: Sign-In Flow / Session Resolution...`);
        await supabase.auth.signOut();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: testEmail, password });
        if (signInError) throw signInError;

        console.log(`Sign In successful mapped to: ${signInData.user?.id}`);

        console.log(`\nTEST 4: Deleting test footprints...`);
        // We use admin service role logic to delete this user to cleanup
        await pool.query(`DELETE FROM auth.users WHERE id = $1`, [signInData.user?.id]);
        console.log(`Deleted successfully.`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runTests();
