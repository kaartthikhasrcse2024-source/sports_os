import { Router } from 'express';
import pool from './db';
import { requireRole, requireAuth } from './auth';

const router = Router();

// Owner Registration Endpoint (does NOT require verified role, only regular TURF_OWNER role)
router.post('/registration', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user.sub;
        if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

        const { owner_name, phone_number, business_name, business_type, registration_number, turf_location, number_of_turfs } = req.body;

        const errors: any = {};
        if (!owner_name || typeof owner_name !== 'string' || owner_name.trim() === '') errors.owner_name = 'Required';
        if (!phone_number || typeof phone_number !== 'string' || phone_number.trim() === '') errors.phone_number = 'Required';
        if (!business_name || typeof business_name !== 'string' || business_name.trim() === '') errors.business_name = 'Required';
        if (!business_type || typeof business_type !== 'string' || business_type.trim() === '') errors.business_type = 'Required';
        if (!number_of_turfs || isNaN(parseInt(number_of_turfs)) || parseInt(number_of_turfs) < 1) errors.number_of_turfs = 'Must be > 0';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'VALIDATION_ERROR', fields: errors });
        }

        const profileRes = await pool.query(`SELECT id, role, user_role FROM profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
        }

        const profile = profileRes.rows[0];
        const rawRole = profile.user_role || profile.role || '';
        if (rawRole.toUpperCase() !== 'TURF_OWNER') {
            return res.status(403).json({ error: 'TURF_OWNER_ROLE_REQUIRED' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const regRes = await client.query(`
                INSERT INTO turf_owner_registrations (
                    user_id, owner_name, phone_number, business_name, business_type, registration_number, turf_location, number_of_turfs, registration_status, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED', NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    owner_name = EXCLUDED.owner_name,
                    phone_number = EXCLUDED.phone_number,
                    business_name = EXCLUDED.business_name,
                    business_type = EXCLUDED.business_type,
                    registration_number = EXCLUDED.registration_number,
                    turf_location = EXCLUDED.turf_location,
                    number_of_turfs = EXCLUDED.number_of_turfs,
                    registration_status = 'SUBMITTED',
                    updated_at = NOW()
                RETURNING *
            `, [userId, owner_name, phone_number, business_name, business_type, registration_number, turf_location, parseInt(number_of_turfs)]);

            const updatedProfileRes = await client.query(`
                UPDATE profiles 
                SET full_name = $1, name = $1
                WHERE id = $2
                RETURNING *
            `, [owner_name, userId]);

            // Ensure a facility exists for this owner so they can use the dashboard immediately
            const facCheck = await client.query(`SELECT id FROM facilities WHERE owner_id = $1`, [userId]);
            if (facCheck.rows.length === 0) {
                // Auto-create a default facility
                const newFac = await client.query(`
                    INSERT INTO facilities (owner_id, name, address, location, is_outdoor)
                    VALUES ($1, $2, $3, ST_GeomFromText('POINT(80.2707 13.0827)', 4326), false)
                    RETURNING id
                `, [userId, business_name || 'My Turf Area', turf_location || 'Chennai']);

                const facId = newFac.rows[0].id;

                // Auto-generate courts based on number_of_turfs
                const courtsToMake = Math.max(1, parseInt(number_of_turfs) || 1);
                for (let i = 1; i <= courtsToMake; i++) {
                    await client.query(`
                        INSERT INTO courts (facility_id, name, sport_type, base_price_per_hour)
                        VALUES ($1, $2, 'Football', 1200)
                    `, [facId, `Field ${i}`]);
                }
            }

            await client.query('COMMIT');

            return res.status(200).json({
                success: true,
                registration: regRes.rows[0],
                profile: updatedProfileRes.rows[0],
                message: "Turf Owner registration submitted successfully."
            });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            console.error("Transaction Error:", dbErr);
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Endpoint Error:", e);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
});

// Restrict all following routes to turf_owner only
router.use(requireRole(['TURF_OWNER']));

router.get('/slots', async (req, res) => {
    try {
        const userId = (req as any).user.sub || (req as any).user.id;

        // 1. Get owner's courts
        const courtsRes = await pool.query(`
            SELECT c.id, c.name, c.base_price_per_hour 
            FROM courts c
            JOIN facilities f ON c.facility_id = f.id
            WHERE f.owner_id = $1
        `, [userId]);

        if (courtsRes.rows.length === 0) {
            return res.json([]);
        }

        // 2. Check if slots exist for today
        const todayStr = new Date().toISOString().split('T')[0];
        const slotsExist = await pool.query(`
            SELECT id FROM slots 
            WHERE court_id = $1 AND start_time >= $2::timestamp AND start_time < ($2::timestamp + interval '1 day')
            LIMIT 1
        `, [courtsRes.rows[0].id, todayStr]);

        // Auto-seed slots for today if they don't exist
        if (slotsExist.rows.length === 0) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const court of courtsRes.rows) {
                    for (let hour = 6; hour <= 23; hour++) {
                        const start = `${todayStr} ${hour.toString().padStart(2, '0')}:00:00`;
                        const end = `${todayStr} ${(hour + 1).toString().padStart(2, '0')}:00:00`;
                        await client.query(`
                            INSERT INTO slots (court_id, start_time, end_time, status)
                            VALUES ($1, $2::timestamp, $3::timestamp, 'available')
                        `, [court.id, start, end]);
                    }
                }
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error("Auto-seed error:", err);
            } finally {
                client.release();
            }
        }

        // 3. Fetch all slots for today
        const result = await pool.query(`
            SELECT s.id, c.name as field, 
                   TO_CHAR(s.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(s.end_time, 'HH12:MI AM') as time,
                   UPPER(s.status::text) as status, 
                   c.base_price_per_hour as price
            FROM slots s
            JOIN courts c ON s.court_id = c.id
            JOIN facilities f ON c.facility_id = f.id
            WHERE f.owner_id = $1 
              AND s.start_time >= $2::timestamp 
              AND s.start_time < ($2::timestamp + interval '1 day')
            ORDER BY c.name, s.start_time
        `, [userId, todayStr]);

        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/slots/override', async (req, res) => {
    try {
        const { id, lock } = req.body;
        const newStatus = lock ? 'expired' : 'available'; // 'expired' acts as maintenance/locked natively
        await pool.query(`UPDATE slots SET status = $1 WHERE id = $2`, [newStatus, id]);
        res.json({ success: true, slot: { id, status: lock ? 'MAINTENANCE' : 'AVAILABLE' } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/roster', async (req, res) => {
    try {
        const userId = (req as any).user.sub || (req as any).user.id;
        // Get all facilities owned by this owner
        const facRes = await pool.query('SELECT id FROM facilities WHERE owner_id = $1', [userId]);
        if (facRes.rows.length === 0) {
            return res.json([]); // No facilities, no roster
        }

        const facilityIds = facRes.rows.map(f => f.id);
        const placeholders = facilityIds.map((_, i) => `$${i + 1}`).join(',');

        // Fetch players whose home turf is one of the owner's facilities
        const result = await pool.query(`
            SELECT p.id, p.name, p.role as preferred, COALESCE(a.primary_position, 'Unknown') as location, 0 as games 
            FROM profiles p
            LEFT JOIN athletic_profiles a ON p.id = a.id
            WHERE p.home_turf_id IN (${placeholders})
        `, facilityIds);

        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/roster/draft-team', async (req, res) => {
    try {
        const { teamName, playerIds } = req.body;
        // Simulate sending push notifications to apps using Capacitor
        res.json({ success: true, message: `Successfully formed team ${teamName} and dispatched push notifications to ${playerIds.length} players!` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/tournaments', async (req, res) => {
    res.json({ success: true, message: 'Tournament created via authorized owner' });
});

router.get('/analytics', async (req, res) => {
    try {
        const userId = (req as any).user.sub || (req as any).user.id;

        // 1. Calculate Revenue from Confirmed Bookings
        const revenueResult = await pool.query(`
            SELECT 
                COALESCE(SUM(b.total_amount), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN b.created_at >= CURRENT_DATE THEN b.total_amount ELSE 0 END), 0) as today_revenue,
                COALESCE(SUM(CASE WHEN b.created_at >= date_trunc('week', CURRENT_DATE) THEN b.total_amount ELSE 0 END), 0) as week_revenue,
                COALESCE(SUM(CASE WHEN b.created_at >= date_trunc('month', CURRENT_DATE) THEN b.total_amount ELSE 0 END), 0) as month_revenue,
                COUNT(b.id) as total_bookings,
                COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN b.status = 'cancelled' OR b.status = 'expired' THEN 1 END) as cancelled_bookings
            FROM bookings b
            JOIN slots s ON b.slot_id = s.id
            JOIN courts c ON s.court_id = c.id
            JOIN facilities f ON c.facility_id = f.id
            WHERE f.owner_id = $1 AND b.status = 'confirmed'
        `, [userId]);

        // Calculate occupancy based on all active/bookable slots (available or booked) over the last 30 days
        const occupancyResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN s.status = 'booked' THEN 1 END) as occupied_slots,
                COUNT(CASE WHEN s.status IN ('available', 'booked') THEN 1 END) as total_slots
            FROM slots s
            JOIN courts c ON s.court_id = c.id
            JOIN facilities f ON c.facility_id = f.id
            WHERE f.owner_id = $1
              AND s.start_time >= CURRENT_DATE - INTERVAL '30 days'
        `, [userId]);

        const rev = revenueResult.rows[0];
        const occ = occupancyResult.rows[0];

        let occupancyRate = 0;
        if (Number(occ.total_slots) > 0) {
            occupancyRate = Math.round((Number(occ.occupied_slots) / Number(occ.total_slots)) * 100);
        }

        res.json({
            summary: {
                totalRevenue: Number(rev.total_revenue),
                todayRevenue: Number(rev.today_revenue),
                weekRevenue: Number(rev.week_revenue),
                monthRevenue: Number(rev.month_revenue),
                totalBookings: Number(rev.total_bookings),
                confirmedBookings: Number(rev.confirmed_bookings),
                cancelledBookings: Number(rev.cancelled_bookings),
                occupancyRate: occupancyRate + '%'
            }
        });
    } catch (e: any) {
        console.error('Analytics aggregation error:', e);
        res.status(500).json({ error: 'Internal server error calculating analytics.' });
    }
});

export default router;
