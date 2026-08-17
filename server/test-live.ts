import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import pool from './src/db';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("Starting LIVE Trigger Integrity Tests...");

    // Create random user email for test
    const randomId = Math.floor(Math.random() * 1000000);
    const testEmail = `live_test_player_${randomId}@example.com`;
    const password = 'TestPassword123!';

    try {
        console.log(`\nTEST: Signup with STRICT 'PLAYER' role...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password,
            options: { data: { full_name: 'Live Test Player', role: 'PLAYER' } }
        });

        if (signUpError) throw new Error(signUpError.message);
        const newId = signUpData.user?.id;
        console.log(`User created in Auth. UID: ${newId}`);

        // Wait 1s for Postgres trigger
        await new Promise(r => setTimeout(r, 1000));

        console.log(`\nTEST: Verifying auth.users...`);
        const authUser = await pool.query(`SELECT id, raw_user_meta_data FROM auth.users WHERE id = $1`, [newId]);
        console.log(`Auth.users exists: YES. UUID: ${authUser.rows[0].id}`);

        console.log(`\nTEST: Verifying public.profiles...`);
        const result = await pool.query(`SELECT id, role, user_role, full_name, name FROM profiles WHERE id = $1`, [newId]);
        if (result.rows.length === 0) {
            console.log("AUTH USER EXISTS BUT PROFILE DOES NOT EXIST");
        } else {
            console.log("PROFILE EXISTS!");
            console.log(result.rows[0]);
        }

        // Check if query selects correctly under RLS
        console.log(`\nTEST: Authenticated Supabase Select...`);
        const { data: rlsSelect, error: rlsError } = await supabase
            .from('profiles')
            .select('user_role')
            .eq('id', newId)
            .single();
        if (rlsError) {
            console.error("SELECT FAILED with Error:", rlsError);
        } else {
            console.log("SELECT SUCCEEDED:", rlsSelect);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

runTests();
