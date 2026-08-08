import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import pool from '../src/db';
import jwt from 'jsonwebtoken';

async function runTest() {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('SUPABASE_JWT_SECRET is required');
    }

    // Fetch or create a test user in auth.users
    let testUserId = '00000000-0000-0000-0000-000000000000';
    try {
        const userResult = await pool.query(`SELECT id FROM auth.users LIMIT 1`);
        if (userResult.rows.length > 0) {
            testUserId = userResult.rows[0].id;
        } else {
            const newUser = await pool.query(`
        INSERT INTO auth.users (id, instance_id, aud, role, email) 
        VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@example.com') 
        RETURNING id
      `, [testUserId]);
            testUserId = newUser.rows[0].id;
        }
    } catch (err: any) {
        console.error('Warning: could not get auth user:', err.message);
    }
    // Sign a test token
    const token = jwt.sign({ sub: testUserId, role: 'authenticated' }, jwtSecret);

    console.log('Seeding database for test...');
    let slotId: string;
    try {
        // 1. Create facility
        const facilityRes = await pool.query(`
      INSERT INTO facilities (name, address) VALUES ('Test Facility', '123 Test St') RETURNING id
    `);
        const facilityId = facilityRes.rows[0].id;

        // 2. Create court
        const courtRes = await pool.query(`
      INSERT INTO courts (facility_id, name, sport_type, base_price_per_hour) VALUES ($1, 'Test Court', 'Tennis', 50) RETURNING id
    `, [facilityId]);
        const courtId = courtRes.rows[0].id;

        // 3. Create slot
        const slotRes = await pool.query(`
      INSERT INTO slots (court_id, start_time, end_time, status) 
      VALUES ($1, now(), now() + interval '1 hour', 'available') RETURNING id
    `, [courtId]);
        slotId = slotRes.rows[0].id;

    } catch (err) {
        console.error('Failed to seed DB:', err);
        process.exit(1);
    }

    console.log(`Seeded slot ${slotId}. Firing 20 concurrent requests...`);
    const API_URL = 'http://localhost:3001/api/v1/bookings/reserve';

    // Create 20 requests
    const requests = Array.from({ length: 20 }).map(async (_, index) => {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    slot_id: slotId,
                    user_id: testUserId,
                    amount: 50
                })
            });
            const data = await res.json();
            return { status: res.status, data };
        } catch (err) {
            return { status: 500, error: String(err) };
        }
    });

    const results = await Promise.all(requests);

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;

    for (const r of results) {
        if (r.status === 201) successCount++;
        else if (r.status === 409 && r.data?.error === 'SLOT_NOT_AVAILABLE') conflictCount++;
        else {
            otherCount++;
            console.error('Unexpected result:', r);
        }
    }

    require('fs').writeFileSync('result.json', JSON.stringify(results, null, 2));

    console.log('\n--- Test Summary ---');
    console.log(`Success (201): ${successCount} (Expected: 1)`);
    console.log(`Conflict (409): ${conflictCount} (Expected: 19)`);
    console.log(`Other: ${otherCount} (Expected: 0)`);

    if (successCount === 1 && conflictCount === 19 && otherCount === 0) {
        console.log('✅ TEST PASSED: Concurrency is safely handled with explicit row locks.');
    } else {
        console.log('❌ TEST FAILED: Concurrency locking did not behave as expected.');
    }

    // cleanup
    await pool.end();
    process.exit(0);
}

runTest();
