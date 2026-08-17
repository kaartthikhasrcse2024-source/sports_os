require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const API = 'http://localhost:3001/api/v1';

async function req(path, method, body, token) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text(); }
    if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
    return data;
}

async function run() {
    console.log('[*] Starting E2E...');
    const tag = Date.now();

    const u_player = await s.auth.signUp({ email: `p_${tag}@test.com`, password: 'pw' });
    const p_tok = u_player.data.session.access_token;

    const u_owner = await s.auth.signUp({ email: `o_${tag}@test.com`, password: 'pw' });
    const o_tok = u_owner.data.session.access_token;

    const u_org = await s.auth.signUp({ email: `org_${tag}@test.com`, password: 'pw' });
    const org_tok = u_org.data.session.access_token;

    console.log('[+] Users created.');

    try {
        console.log('[*] Testing Owner Registration');
        await req('/owner/register', 'POST', { name: 'Owner_A', email: `o_${tag}@test.com`, phone: '999', business_name: 'Biz A', govt_id: 'ID123' }, o_tok);

        console.log('[*] Testing Player Registration');
        await req('/players/register', 'POST', { name: 'Player_A', phone: '888', bio: 'foo' }, p_tok);

        console.log('[*] Testing Organizer Registration');
        await req('/organizer/register', 'POST', { name: 'Org_A', email: `org_${tag}@test.com`, phone: '777', organization_name: 'Orgs' }, org_tok);

        // Try getting owner dashboard (requires verification_status='VERIFIED')
        console.log('[*] Testing Verification Bypass in JS (simulate admin approving owner)');
        // Let's just bypass using pg directly to approve the owner
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pool.query("UPDATE profiles SET govt_verification_status = 'VERIFIED', phone_verified = true, verification_status = 'VERIFIED'");

        console.log('[*] Testing Owner Dashboard');
        await req('/owner/dashboard', 'GET', null, o_tok);

        console.log('[*] Creating Facility as Owner');
        const f = await req('/owner/facilities', 'POST', { name: 'Turf A', address: '123', location: { lat: 10, lng: 10 } }, o_tok);

        console.log('[+] ALL GREEN FOR INIT.');
        process.exit(0);

    } catch (e) {
        console.error('[-] FAILURE DETECTED:', e.message);
        process.exit(1);
    }
}
run();
