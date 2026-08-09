"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const db_1 = __importDefault(require("../src/db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function runGroupTest() {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret)
        throw new Error('SUPABASE_JWT_SECRET is required');
    let testUserId = '00000000-0000-0000-0000-000000000000';
    let testUserId2 = '00000000-0000-0000-0000-000000000001';
    let testUserId3 = '00000000-0000-0000-0000-000000000002';
    // Seed Users
    for (const uid of [testUserId, testUserId2, testUserId3]) {
        try {
            await db_1.default.query(`
          INSERT INTO auth.users (id, instance_id, aud, role, email) 
          VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'split@example.com') 
          ON CONFLICT DO NOTHING
        `, [uid]);
        }
        catch (e) { }
    }
    const token = jsonwebtoken_1.default.sign({ sub: testUserId, role: 'authenticated' }, jwtSecret);
    // Seed Slot
    const facilityRes = await db_1.default.query(`INSERT INTO facilities (name, address) VALUES ('Group Facility', '123') RETURNING id`);
    const facilityId = facilityRes.rows[0].id;
    const courtRes = await db_1.default.query(`INSERT INTO courts (facility_id, name, sport_type, base_price_per_hour) VALUES ($1, 'Court', 'Tennis', 50) RETURNING id`, [facilityId]);
    const courtId = courtRes.rows[0].id;
    const slotRes = await db_1.default.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now(), now() + interval '1 hour', 'available') RETURNING id`, [courtId]);
    const slotId = slotRes.rows[0].id;
    console.log(`[1] Seeded Slot: ${slotId}. Submitting Group Booking...`);
    const res = await fetch('http://localhost:3001/api/v1/bookings/group-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slot_id: slotId, user_id: testUserId, amount: 900, contributor_ids: [testUserId, testUserId2, testUserId3] })
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    }
    catch (e) {
        console.error('API failed with non-JSON response:', text);
        process.exit(1);
    }
    if (!res.ok) {
        console.error('API Error:', data);
        process.exit(1);
    }
    const bookingId = data.booking_id;
    console.log(`[2] Booking created: ${bookingId}. BullMQ check job scheduled for 30 seconds.`);
    console.log(`[2] Booking created: ${bookingId}. BullMQ check job scheduled for 30 seconds.`);
    // Fetch contributions
    const contribRes = await db_1.default.query('SELECT * FROM booking_contributions WHERE booking_id = $1', [bookingId]);
    const contributions = contribRes.rows;
    console.log(`[3] Generated ${contributions.length} contributions of ${contributions[0].amount_owed}.`);
    // Simulate Payments for 2 out of 3 users
    console.log(`[4] Simulating payment for 2 users...`);
    await db_1.default.query(`UPDATE booking_contributions SET status = 'paid' WHERE id = $1`, [contributions[0].id]);
    await db_1.default.query(`UPDATE booking_contributions SET status = 'paid' WHERE id = $1`, [contributions[1].id]);
    console.log(`[5] Waiting 35 seconds to allow background worker to process cancellation...`);
    await new Promise(r => setTimeout(r, 35000));
    const finalBooking = await db_1.default.query('SELECT status FROM bookings WHERE id = $1', [bookingId]);
    const finalSlot = await db_1.default.query('SELECT status FROM slots WHERE id = $1', [slotId]);
    console.log(`\n--- Test Verification ---`);
    console.log(`Booking Status: ${finalBooking.rows[0].status} (Expected: cancelled)`);
    console.log(`Slot Status: ${finalSlot.rows[0].status} (Expected: available)`);
    if (finalBooking.rows[0].status === 'cancelled' && finalSlot.rows[0].status === 'available') {
        console.log('✅ TEST PASSED: BullMQ background cleanup worker ran successfully on 30s threshold due to unpaid shares.');
    }
    else {
        console.log('❌ TEST FAILED: Cleanup not executed.');
    }
    await db_1.default.end();
    process.exit(0);
}
runGroupTest();
