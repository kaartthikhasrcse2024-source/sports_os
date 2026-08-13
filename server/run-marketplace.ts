import pool from './src/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('🚀 Booting 3-Actor Database Seeding and Integrations...');

    // 1. Run the raw SQL schema
    const schemaPath = path.join(__dirname, '../marketplace-schema.sql');
    try {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Base marketplace schema strictly mapped (ENUMs, PostGIS geo-location, Transactions Table) applied!');
    } catch (e: any) {
        if (!e.message.includes('already exists')) {
            console.error('❌ Schema Migration crash:', e);
            process.exit(1);
        }
    }

    const client = await pool.connect();

    try {
        // 2. Clear out seed pollution
        await client.query(`DELETE FROM transactions`);

        // Force literal trigger patch
        await client.query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger AS $$
            BEGIN
              INSERT INTO public.profiles (id, name, role)
              VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
                COALESCE(NEW.raw_user_meta_data->>'role', 'PLAYER')::user_role
              )
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name;
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);

        // Ensure dummy roles exist in auth.users (requires circumventing foreign key or using known hardcoded bypass). 
        // We'll directly inject into profiles avoiding foreign key check temporarily if we lack auth.users, 
        // OR we'll inject mock auth.users first.

        await client.query(`
            INSERT INTO auth.users (id, instance_id, aud, role, email)
            VALUES 
              ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'playerX_seed@test.com'),
              ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'turfOwnerY_seed@test.com'),
              ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'organizerZ_seed@test.com')
            ON CONFLICT (id) DO NOTHING;
        `);

        // Seed 1: The Player
        await client.query(`
            INSERT INTO profiles (id, name, role, phone_verified, otp_verified_at)
            VALUES ('00000000-0000-0000-0000-000000000001', 'Player Alpha', 'PLAYER', true, NOW())
            ON CONFLICT (id) DO UPDATE SET role = 'PLAYER', phone_verified = EXCLUDED.phone_verified, otp_verified_at = EXCLUDED.otp_verified_at;
        `);

        // Seed 2: The Turf Owner (With PostGIS dummy coordinates)
        await client.query(`
            INSERT INTO profiles (id, name, role, business_tax_id, govt_verification_status, geo_location)
            VALUES ('00000000-0000-0000-0000-000000000002', 'Venue Operations LLC', 'TURF_OWNER', 'TAX-12345', 'VERIFIED', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326))
            ON CONFLICT (id) DO UPDATE SET role = 'TURF_OWNER', business_tax_id = EXCLUDED.business_tax_id, govt_verification_status = EXCLUDED.govt_verification_status;
        `);

        // Seed 3: The TO
        await client.query(`
            INSERT INTO profiles (id, name, role, organizer_cert_id, verification_status)
            VALUES ('00000000-0000-0000-0000-000000000003', 'Liga Tournaments', 'TOURNAMENT_ORGANIZER', 'CERT-99XZB', 'PENDING')
            ON CONFLICT (id) DO UPDATE SET role = 'TOURNAMENT_ORGANIZER', organizer_cert_id = EXCLUDED.organizer_cert_id;
        `);

        console.log('✅ Three-actor marketplace seeded securely.');
        console.log('----------------------------------------------------');

        // 3. Emulate Row-locked transaction
        console.log('🔥 Simulating FOR UPDATE transaction for Tournament Ledger...');
        await client.query('BEGIN');

        // Fetch to lock
        const lockedOrgRes = await client.query(`SELECT id, verification_status FROM profiles WHERE id = '00000000-0000-0000-0000-000000000003' FOR UPDATE`);
        console.log(`Lock acquired on Tournament Organizer: ${lockedOrgRes.rows[0].id}`);

        // Insert mock Tournament Entry via Calculator Math (Pre-computed ₹2000 in our test suite) -> Gross: 200000, fee: 20000, net: 180000
        await client.query(`
            INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, status)
            VALUES ('TOURNAMENT_ENTRY', '00000000-0000-0000-0000-000000000003', 'TOURNAMENT_ORGANIZER', 200000, 20000, 180000, 'COMPLETED')
        `);

        await client.query('COMMIT');
        console.log('✅ Row locked, math inserted, and transaction successfully flushed.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ SEED CRASH:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
