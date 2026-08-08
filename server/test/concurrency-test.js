"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../src/db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function runTest() {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('SUPABASE_JWT_SECRET is required');
    }
    // Use a hardcoded dummy user ID for testing
    const testUserId = '00000000-0000-0000-0000-000000000000';
    // Sign a test token
    const token = jsonwebtoken_1.default.sign({ sub: testUserId, role: 'authenticated' }, jwtSecret);
    console.log('Seeding database for test...');
    let slotId;
    try {
        // 1. Create facility
        const facilityRes = await db_1.default.query(`
      INSERT INTO facilities (name, address) VALUES ('Test Facility', '123 Test St') RETURNING id
    `);
        const facilityId = facilityRes.rows[0].id;
        // 2. Create court
        const courtRes = await db_1.default.query(`
      INSERT INTO courts (facility_id, name, sport_type, base_price_per_hour) VALUES ($1, 'Test Court', 'Tennis', 50) RETURNING id
    `, [facilityId]);
        const courtId = courtRes.rows[0].id;
        // 3. Create slot
        const slotRes = await db_1.default.query(`
      INSERT INTO slots (court_id, start_time, end_time, status) 
      VALUES ($1, now(), now() + interval '1 hour', 'available') RETURNING id
    `, [courtId]);
        slotId = slotRes.rows[0].id;
    }
    catch (err) {
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
        }
        catch (err) {
            return { status: 500, error: String(err) };
        }
    });
    const results = await Promise.all(requests);
    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;
    for (const r of results) {
        if (r.status === 201)
            successCount++;
        else if (r.status === 409 && r.data?.error === 'SLOT_NOT_AVAILABLE')
            conflictCount++;
        else {
            otherCount++;
            console.error('Unexpected result:', r);
        }
    }
    console.log('\n--- Test Summary ---');
    console.log(`Success (201): ${successCount} (Expected: 1)`);
    console.log(`Conflict (409): ${conflictCount} (Expected: 19)`);
    console.log(`Other: ${otherCount} (Expected: 0)`);
    if (successCount === 1 && conflictCount === 19 && otherCount === 0) {
        console.log('✅ TEST PASSED: Concurrency is safely handled with explicit row locks.');
    }
    else {
        console.log('❌ TEST FAILED: Concurrency locking did not behave as expected.');
    }
    // cleanup
    await db_1.default.end();
    process.exit(0);
}
runTest();
//# sourceMappingURL=concurrency-test.js.map