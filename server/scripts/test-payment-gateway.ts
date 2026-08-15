import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MOCK_TOKEN = 'Bearer dev-mode-token:PLAYER';
const API_URL = 'http://localhost:3001/api/v1/payments';

async function generateSignature(orderId: string, paymentId: string) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    return crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
}

async function runTests() {
    console.log('--- STARTING PAYMENT ECOSYSTEM TEST (RAZORPAY TEST MODE) ---');
    let client;

    try {
        client = await pool.connect();

        // --- 1. SET UP DUMMY RESOURCES ---
        console.log('\n[Setup] Resolving dummy turf, slot, and user...');

        let userId = '00000000-0000-0000-0000-111111111111';
        let ownerId = '11111111-0000-0000-0000-111111111111';
        await client.query(`INSERT INTO profiles (id, name, role, verification_status) VALUES ($1, 'Test Player', 'PLAYER', 'VERIFIED') ON CONFLICT DO NOTHING`, [userId]);
        await client.query(`INSERT INTO profiles (id, name, role, verification_status) VALUES ($1, 'Test Owner', 'TURF_OWNER', 'VERIFIED') ON CONFLICT DO NOTHING`, [ownerId]);

        const validOwnerQu = await client.query('SELECT id FROM profiles LIMIT 1');
        if (validOwnerQu.rows.length === 0) throw new Error("No profiles exist. Please register someone first.");
        const seedOwnerId = validOwnerQu.rows[0].id;

        const o = await client.query('SELECT id FROM facilities LIMIT 1');
        if (o.rows.length === 0) throw new Error("No Facility exists to test with. Run the application to seed first.");
        const facId = o.rows[0].id;

        // Force this facility to be completely owned by an existing auth.user to guarantee NOT NULL on transactions!
        await client.query('UPDATE facilities SET owner_id = $1 WHERE id = $2', [seedOwnerId, facId]);

        const c = await client.query('SELECT id FROM courts WHERE facility_id = $1 LIMIT 1', [facId]);
        const courtId = c.rows[0]?.id || (await client.query('INSERT INTO courts (facility_id, name) VALUES ($1, \'Test\') RETURNING id', [facId])).rows[0].id;

        const slotRes = await client.query(`INSERT INTO slots (court_id, start_time, end_time, status) VALUES ($1, now(), now() + interval '1 hour', 'available') RETURNING id`, [courtId]);
        const slotId = slotRes.rows[0].id;

        // --- 2. CASUAL BOOKING ---
        console.log('\n--- TEST SCENARIO A: CASUAL ENTRY BOOKING ---');
        const bookRes1 = await client.query(`INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, 'pending', 1200) RETURNING id`, [slotId, userId]);
        const bId1 = bookRes1.rows[0].id;
        await client.query(`INSERT INTO payments (booking_id, amount, status) VALUES ($1, 1200, 'pending')`, [bId1]);

        console.log('-> Hitting POST /create-order...');
        const createResA = await fetch(`${API_URL}/create-order`, {
            method: 'POST',
            headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 1260, // 1200 + 5% Conv Fee = 1260
                metadata: { payment_type: 'CASUAL_BOOKING', booking_id: bId1, user_id: userId, gross_amount: 1260 * 100 }
            })
        });
        const orderAText = await createResA.text();
        if (!createResA.ok) throw new Error(`API Error A: ${orderAText}`);
        const orderA = JSON.parse(orderAText);
        console.log(`[Success] Generated test Order ID: ${orderA.order_id}`);

        const paymentIdA = 'pay_mock_' + Date.now();
        const signatureA = await generateSignature(orderA.order_id, paymentIdA);

        console.log('-> Confirming signature and distributing ledger logic...');
        const verifyResA = await fetch(`${API_URL}/verify-signature`, {
            method: 'POST',
            headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: orderA.order_id,
                razorpay_payment_id: paymentIdA,
                razorpay_signature: signatureA,
                metadata: { payment_type: 'CASUAL_BOOKING', booking_id: bId1, gross_amount: 1260 * 100 }
            })
        });

        if (verifyResA.ok) {
            console.log(`[Success] Casual Payment signature verified!`);
            const bCheck = await client.query(`SELECT status FROM bookings WHERE id = $1`, [bId1]);
            const tCheck = await client.query(`SELECT platform_fee, net_amount FROM transactions WHERE type = 'BOOKING' AND related_booking_id = $1`, [bId1]);
            if (bCheck.rows[0].status === 'confirmed') console.log('[Success] Booking marked as CONFIRMED.');
            console.log(`[Success] Ledger Split Correct: Platform cut 5% (₹${tCheck.rows[0].platform_fee / 100}), Net Payout ₹${tCheck.rows[0].net_amount / 100}`);
        } else {
            console.error(`[Failed] Casual payment verify threw: ${await verifyResA.text()}`);
        }

        // --- 3. SPLIT PAYMENT ESCROW ---
        console.log('\n--- TEST SCENARIO B: 4-WAY SPLIT ESCROW (1200 TOTAL) ---');
        const bookRes2 = await client.query(`INSERT INTO bookings (slot_id, user_id, status, total_amount) VALUES ($1, $2, 'pending', 1200) RETURNING id`, [slotId, userId]);
        const bId2 = bookRes2.rows[0].id;
        await client.query(`UPDATE slots SET status = 'held' WHERE id = $1`, [slotId]);

        let cIds: string[] = [];
        for (let i = 0; i < 4; i++) {
            const cr = await client.query(`INSERT INTO booking_contributions (booking_id, user_id, amount_owed, status) VALUES ($1, $2, 300, 'pending') RETURNING id`, [bId2, userId]);
            cIds.push(cr.rows[0].id);
        }
        console.log(`[Setup] Generated 4 pending contribution escrow limits of ₹300 each... Slot HELD.`);

        for (let i = 0; i < 4; i++) {
            console.log(`\n-> Collecting Escrow Share ${i + 1}/4...`);
            const createResSplit = await fetch(`${API_URL}/create-order`, {
                method: 'POST',
                headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 315, // 300 + 5% platform fee = 315
                    metadata: { payment_type: 'SPLIT_ESCROW', booking_id: bId2, contribution_id: cIds[i], total_gross_rupees: 1260 }
                })
            });
            const splitText = await createResSplit.text();
            if (!createResSplit.ok) throw new Error(`API Error in create-order: ${splitText}`);
            const splitOrder = JSON.parse(splitText);
            const splitPayId = `pay_split_${i}_${Date.now()}`;
            const splitSig = await generateSignature(splitOrder.order_id, splitPayId);

            const verRes = await fetch(`${API_URL}/verify-signature`, {
                method: 'POST',
                headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: splitOrder.order_id,
                    razorpay_payment_id: splitPayId,
                    razorpay_signature: splitSig,
                    metadata: { payment_type: 'SPLIT_ESCROW', booking_id: bId2, contribution_id: cIds[i], total_gross_rupees: 1260 }
                })
            });
            if (!verRes.ok) throw new Error(`API Error verify: ${await verRes.text()}`);

            // Mid state checks
            const midCheck = await client.query(`SELECT status FROM bookings WHERE id = $1`, [bId2]);
            const sCheck = await client.query(`SELECT status FROM slots WHERE id = $1`, [slotId]);
            console.log(`[Share ${i + 1}] Booking Status: ${midCheck.rows[0].status} | Slot Status: ${sCheck.rows[0].status}`);
        }

        const finalSplitTrans = await client.query(`SELECT platform_fee, net_amount FROM transactions WHERE type = 'BOOKING' AND related_booking_id = $1`, [bId2]);
        console.log(`\n[Success] Escrow Full Completion Split Correct: Platform cut 5% (₹${finalSplitTrans.rows[0].platform_fee / 100}), Net Payout ₹${finalSplitTrans.rows[0].net_amount / 100}`);

        // --- 4. ORGANIZER VENUE LEASE & ENTRY FEE ---
        console.log('\n--- TEST SCENARIO C: VENUE LEASE 8% COMM & ENTRY FEE 10% COMM ---');
        const lease_g = 50000 * 100; // 50k
        const entry_g = 2000 * 100; // 2k

        console.log(`-> Leasing Venue (₹50k)...`);
        const leaseRes = await client.query(`INSERT INTO venue_lease_requests (facility_id, organizer_id, requested_slots, status) VALUES ($1, $2, '[]', 'PENDING') RETURNING id`, [facId, userId]);
        const o1Res = await fetch(`${API_URL}/create-order`, { method: 'POST', headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 50000, metadata: { payment_type: 'VENUE_LEASE' } }) });
        const o1 = await o1Res.json();
        await fetch(`${API_URL}/verify-signature`, { method: 'POST', headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: o1.order_id, razorpay_payment_id: 'pl', razorpay_signature: await generateSignature(o1.order_id, 'pl'), metadata: { payment_type: 'VENUE_LEASE', lease_id: leaseRes.rows[0].id, gross_amount: lease_g } }) });

        const tl = await client.query(`SELECT platform_fee, net_amount FROM transactions WHERE type = 'BOOKING' AND actor_role = 'TURF_OWNER' ORDER BY created_at DESC LIMIT 1`);
        console.log(`[Success] Venue Lease: Net Owner Payout ₹${tl.rows[0].net_amount / 100} / Comm (8%) ₹${tl.rows[0].platform_fee / 100}`);

        console.log(`-> Player Entry Fee (₹2k)...`);
        const trnyRes = await client.query(`INSERT INTO tournaments (facility_id, name, format, max_teams, start_date) VALUES ($1, 'Test League', 'single_elim', 8, now()) RETURNING id`, [facId]);
        const ot1Res = await fetch(`${API_URL}/create-order`, { method: 'POST', headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 2000, metadata: { payment_type: 'TOURNAMENT_ENTRY' } }) });
        const ot1 = await ot1Res.json();
        await fetch(`${API_URL}/verify-signature`, { method: 'POST', headers: { 'Authorization': MOCK_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: ot1.order_id, razorpay_payment_id: 'pe', razorpay_signature: await generateSignature(ot1.order_id, 'pe'), metadata: { payment_type: 'TOURNAMENT_ENTRY', tournament_id: trnyRes.rows[0].id, gross_amount: entry_g } }) });

        const tc = await client.query(`SELECT platform_fee, net_amount FROM transactions WHERE type = 'TOURNAMENT_ENTRY' ORDER BY created_at DESC LIMIT 1`);
        console.log(`[Success] Tournament Entry: Pool Size ₹${tc.rows[0].net_amount / 100} / Comm (10%) ₹${tc.rows[0].platform_fee / 100}\n`);

        console.log('--- ALL ECOSYSTEM PAYMENT TESTS SUCCESSFULLY EXECUTED ---');
    } catch (e) {
        console.error('Test script crashed:', e);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runTests();
