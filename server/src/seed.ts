import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UUIDS = {
    owner1: '00000000-0000-0000-0000-111111110001',
    owner2: '00000000-0000-0000-0000-111111110002',
    org1: '00000000-0000-0000-0000-222222220001',
    org2: '00000000-0000-0000-0000-222222220002',
    ply101: '00000000-0000-0000-0000-333333330101',
    ply102: '00000000-0000-0000-0000-333333330102',
    ply103: '00000000-0000-0000-0000-333333330103',
    ply104: '00000000-0000-0000-0000-333333330104',
    ply105: '00000000-0000-0000-0000-333333330105',
    ply106: '00000000-0000-0000-0000-333333330106'
};

async function insertUser(id: string, email: string, name: string, role: string, phone?: string, is_verified: boolean = true) {
    // 1. auth.users
    await pool.query(
        `INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [id, email]
    );

    // 2. profiles
    await pool.query(
        `INSERT INTO profiles (id, name, role, verification_status, created_at) 
         VALUES ($1, $2, $3, $4, now()) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, verification_status = EXCLUDED.verification_status`,
        [id, name, role, is_verified ? 'VERIFIED' : 'PENDING']
    );
}

async function insertFacility(ownerId: string, name: string, address: string, lat: number, lng: number, amenities: any) {
    const res = await pool.query(
        `INSERT INTO facilities (owner_id, name, address, location, amenities) 
         VALUES ($1, $2, $3, ST_SetSRID(ST_Point($5, $4), 4326), $6) 
         RETURNING id`,
        [ownerId, name, address, lat, lng, amenities]
    );
    return res.rows[0].id;
}

async function insertCourt(facilityId: string, name: string, sportType: string, rate: number) {
    const res = await pool.query(
        `INSERT INTO courts (facility_id, name, sport_type, base_price_per_hour) VALUES ($1, $2, $3, $4) RETURNING id`,
        [facilityId, name, sportType, rate]
    );
    return res.rows[0].id;
}

async function main() {
    console.log('--- STARTING SPORTS OS SEEDING ---');
    try {
        // --- 1. MOCK TURF OWNERS ---
        console.log('Seeding Turf Owners...');
        await insertUser(UUIDS.owner1, 'vignesh@downtownarena.in', 'Vigneshwaran R.', 'TURF_OWNER');
        const fac1 = await insertFacility(UUIDS.owner1, 'Downtown Arena & Turf Hub', '4th Main Road, Anna Nagar, Chennai - 600040', 13.0850, 80.2101, { "sports": ["Football (5-a-side)", "Box Cricket"] });

        await insertUser(UUIDS.owner2, 'karthik@bayviewsmash.in', 'Karthik Subramaniam', 'TURF_OWNER');
        const fac2 = await insertFacility(UUIDS.owner2, 'Bayview Smash & Turf Hub', 'East Coast Road (ECR), Neelankarai, Chennai - 600115', 12.9492, 80.2547, { "sports": ["Badminton", "Football (7-a-side)"] });

        const fac1_c1 = await insertCourt(fac1, 'Field 1', 'Football (5-a-side)', 1200);
        const fac1_c2 = await insertCourt(fac1, 'Field 2', 'Box Cricket', 1200);
        const fac2_c1 = await insertCourt(fac2, 'Field 1', 'Badminton', 800);
        const fac2_c2 = await insertCourt(fac2, 'Field 2', 'Football (7-a-side)', 800);

        // --- 2. MOCK TOURNAMENT ORGANIZERS ---
        console.log('Seeding Tournament Organizers...');
        await insertUser(UUIDS.org1, 'anand@chennaisuperleagues.com', 'Chennai Super Leagues (CSL)', 'TOURNAMENT_ORGANIZER');
        await insertUser(UUIDS.org2, 'divya@ecrsmash.org', 'ECR Smash Masters', 'TOURNAMENT_ORGANIZER');

        // Create Tournaments
        await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date) 
             VALUES ($1, 'Chennai Premier Futsal Cup 2026', 'single_elim', 8, now() + interval '7 days')`,
            [fac1]
        );
        await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date) 
             VALUES ($1, 'Coastal Badminton Championship', 'round_robin', 16, now() + interval '14 days')`,
            [fac2]
        );

        // --- 3. MOCK PLAYERS ---
        console.log('Seeding Players...');
        await insertUser(UUIDS.ply101, 'ashwin@gmail.com', 'Ashwin Kumar', 'PLAYER');
        await insertUser(UUIDS.ply102, 'riyas@gmail.com', 'Mohamed Riyas', 'PLAYER');
        await insertUser(UUIDS.ply103, 'pradeep@gmail.com', 'Pradeep Chandran', 'PLAYER');
        await pool.query(`UPDATE profiles SET home_turf_id = $1 WHERE id IN ($2, $3, $4)`, [fac1, UUIDS.ply101, UUIDS.ply102, UUIDS.ply103]);

        await insertUser(UUIDS.ply104, 'kavya@gmail.com', 'Kavyashree S.', 'PLAYER');
        await insertUser(UUIDS.ply105, 'deepak@gmail.com', 'Deepak Raj', 'PLAYER');
        await insertUser(UUIDS.ply106, 'siddharth@gmail.com', 'Siddharth V.', 'PLAYER');
        await pool.query(`UPDATE profiles SET home_turf_id = $1 WHERE id IN ($2, $3, $4)`, [fac2, UUIDS.ply104, UUIDS.ply106, UUIDS.ply105]);

        // --- 4. MOCK SLOTS & TRANSACTIONS ---
        console.log('Seeding Slots & Transactions...');
        // 2 slots AVAILABLE (1200)
        await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now(), now() + interval '1 hour', 'available')`, [fac1_c1]);
        await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now() + interval '1 hour', now() + interval '2 hours', 'available')`, [fac1_c1]);

        // 1 slot HELD (15-min split escrow)
        const escrowSlot = await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now() + interval '2 hours', now() + interval '3 hours', 'held') RETURNING id`, [fac1_c2]);
        const eb = await pool.query(`INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, 'pending', 1200) RETURNING id`, [escrowSlot.rows[0].id, UUIDS.ply101]);
        await pool.query(`INSERT INTO booking_contributions (booking_id, user_id, amount_owed, status) VALUES ($1, $2, 600, 'pending')`, [eb.rows[0].id, UUIDS.ply101]);
        await pool.query(`INSERT INTO booking_contributions (booking_id, user_id, amount_owed, status) VALUES ($1, $2, 600, 'pending')`, [eb.rows[0].id, UUIDS.ply102]);

        // 1 slot BOOKED (Paid casual booking)
        const bookedSlot = await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now() + interval '3 hours', now() + interval '4 hours', 'booked') RETURNING id`, [fac2_c1]);
        const cb = await pool.query(`INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, 'confirmed', 800) RETURNING id`, [bookedSlot.rows[0].id, UUIDS.ply104]);
        await pool.query(`
            INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, related_booking_id, status)
            VALUES ('BOOKING', $1, 'TURF_OWNER', 80000, 4000, 76000, $2, 'COMPLETED')
        `, [UUIDS.owner2, cb.rows[0].id]);

        // 2 slots TOURNAMENT_LOCKED (Leased by Chennai Super Leagues)
        const tl1 = await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now() + interval '4 hours', now() + interval '5 hours', 'booked') RETURNING id`, [fac1_c1]);
        const tl2 = await pool.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now() + interval '5 hours', now() + interval '6 hours', 'booked') RETURNING id`, [fac1_c1]);

        // Emulate the lease request & mappings
        const leaseRes = await pool.query(`
            INSERT INTO venue_lease_requests (facility_id, organizer_id, requested_slots, status)
            VALUES ($1, $2, $3, 'APPROVED') RETURNING id
        `, [fac1, UUIDS.org1, JSON.stringify([tl1.rows[0].id, tl2.rows[0].id])]);

        await pool.query(`
            INSERT INTO transactions (type, actor_id, actor_role, gross_amount, platform_fee, net_amount, status)
            VALUES ('BOOKING', $1, 'TURF_OWNER', 240000, 19200, 220800, 'COMPLETED')
        `, [UUIDS.owner1]);

        console.log('--- SEEDING COMPLETE! ---');
    } catch (e: any) {
        console.error('SEEDING FAILED:', e);
    } finally {
        await pool.end();
    }
}

main();
