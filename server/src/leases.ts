import { Router } from 'express';
import pool from './db';
import { requireAuth } from './auth';
import { createNotification } from './services/notifications';

const router = Router();

// PUT Profile My Home Base
router.put('/players/:id/home-turf', async (req, res) => {
    const id = req.params.id as string;
    const { facility_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE profiles SET home_turf_id = $1 WHERE id = $2 AND user_role = 'PLAYER' RETURNING *`,
            [facility_id, id]
        );
        res.json({ success: true, profile: result.rows[0] });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET Outgoing Organizer Leases
router.get('/outgoing', async (req, res) => {
    const user = (req as any).user;
    try {
        const result = await pool.query(
            `SELECT vlr.*, f.name as facility_name 
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             WHERE vlr.organizer_id = $1 ORDER BY vlr.created_at DESC`,
            [user.sub || user.id]
        );
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET Incoming Turf Owner Leases
router.get('/incoming', async (req, res) => {
    const user = (req as any).user;
    try {
        const result = await pool.query(
            `SELECT vlr.*, f.name as facility_name, p.name as organizer_name
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             JOIN profiles p ON vlr.organizer_id = p.id
             WHERE f.owner_id = $1 ORDER BY vlr.created_at DESC`,
            [user.sub || user.id]
        );
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST Venue Rental Requests
router.post('/requests', requireAuth, async (req, res) => {
    const { facility_id, requested_slots } = req.body;
    const organizer_id = (req as any).user.sub || (req as any).user.id;

    // Quick validation array
    if (!facility_id || !organizer_id || !requested_slots) {
        res.status(400).json({ error: 'Missing core lease mapping bounds.' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO venue_lease_requests (facility_id, organizer_id, requested_slots) 
             VALUES ($1, $2, $3) RETURNING *`,
            [facility_id, organizer_id, JSON.stringify(requested_slots)]
        );

        // Fetch Facility Owner to notify them natively
        const ownerQ = await pool.query(`SELECT owner_id, name FROM facilities WHERE id = $1`, [facility_id]);
        if (ownerQ.rows.length > 0) {
            await createNotification(pool, {
                recipientId: ownerQ.rows[0].owner_id,
                actorId: organizer_id,
                type: 'LEASE_REQUESTED',
                title: 'New Venue Lease Request',
                message: `A Tournament Organizer requested a lease for ${ownerQ.rows[0].name}.`,
                entityType: 'VENUE_LEASE_REQUEST',
                entityId: result.rows[0].id
            });
        }

        res.json({ success: true, lease: result.rows[0] });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT Approve/Reject Lease
router.put('/requests/:id/:action', requireAuth, async (req, res) => {
    const id = req.params.id as string;
    const action = req.params.action as string;
    const status = (action as string).toUpperCase() + 'ED';
    const auth_user = (req as any).user.sub || (req as any).user.id;

    if (['APPROVED', 'REJECTED'].indexOf(status) === -1) {
        return res.status(400).json({ error: 'Invalid action.' });
    }

    try {
        await pool.query('BEGIN');

        // 1. Lock the lease request row & get facility info
        const leaseQuery = await pool.query(
            `SELECT vlr.*, f.owner_id 
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             WHERE vlr.id = $1 FOR UPDATE`,
            [id]
        );

        if (leaseQuery.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Lease request not found.' });
        }

        const lease = leaseQuery.rows[0];

        // Verify ownership and state
        if (lease.owner_id !== auth_user) {
            await pool.query('ROLLBACK');
            return res.status(403).json({ error: 'Unauthorized to modify this facility.' });
        }

        if (lease.status !== 'PENDING') {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Request is no longer pending.' });
        }

        // 2. Perform actual slot reservation constraints
        if (status === 'APPROVED') {
            // Find what date was requested
            const requestedSlots = (lease.requested_slots as any) || {};
            const requestedDate = requestedSlots.date;

            if (requestedDate) {
                // Lock slots for that facility on that exact date
                const slotsToLock = await pool.query(
                    `SELECT s.id, s.status 
                     FROM slots s
                     JOIN courts c ON s.court_id = c.id
                     WHERE c.facility_id = $1
                       AND s.start_time >= $2::timestamp 
                       AND s.start_time < ($2::timestamp + interval '1 day')
                     FOR UPDATE`,
                    [lease.facility_id, requestedDate]
                );

                // Verify every slot in the list is still available
                const unavailableSlots = slotsToLock.rows.filter(s => s.status !== 'available');
                if (unavailableSlots.length > 0) {
                    await pool.query('ROLLBACK');
                    return res.status(409).json({ error: 'Cannot approve lease because some slots are no longer available (actively booked).' });
                }

                // Update requested slots back to booked/reserved vocabulary (status: 'booked')
                if (slotsToLock.rows.length > 0) {
                    const slotIds = slotsToLock.rows.map(s => s.id);
                    await pool.query(
                        `UPDATE slots SET status = 'booked', updated_at = now() WHERE id = ANY($1)`,
                        [slotIds]
                    );
                }
            }
        }

        // Finally, update lease request
        const leaseResp = await pool.query(
            `UPDATE venue_lease_requests SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        await pool.query('COMMIT');

        await createNotification(pool, {
            recipientId: lease.organizer_id,
            actorId: auth_user,
            type: status === 'APPROVED' ? 'LEASE_APPROVED' : 'LEASE_REJECTED',
            title: `Lease Request ${status}`,
            message: `Your requested venue rental has been ${status.toLowerCase()}.`,
            entityType: 'VENUE_LEASE_REQUEST',
            entityId: id
        });

        res.json({ success: true, lease: leaseResp.rows[0] });
    } catch (e: any) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

export default router;
