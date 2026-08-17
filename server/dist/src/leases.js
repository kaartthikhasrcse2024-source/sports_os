"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const auth_1 = require("./auth");
const notifications_1 = require("./services/notifications");
const router = (0, express_1.Router)();
// PUT Profile My Home Base
router.put('/players/:id/home-turf', async (req, res) => {
    const id = req.params.id;
    const { facility_id } = req.body;
    try {
        const result = await db_1.default.query(`UPDATE profiles SET home_turf_id = $1 WHERE id = $2 AND user_role = 'PLAYER' RETURNING *`, [facility_id, id]);
        res.json({ success: true, profile: result.rows[0] });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET Outgoing Organizer Leases
router.get('/outgoing', async (req, res) => {
    const user = req.user;
    try {
        const result = await db_1.default.query(`SELECT vlr.*, f.name as facility_name 
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             WHERE vlr.organizer_id = $1 ORDER BY vlr.created_at DESC`, [user.sub || user.id]);
        res.json(result.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET Incoming Turf Owner Leases
router.get('/incoming', async (req, res) => {
    const user = req.user;
    try {
        const result = await db_1.default.query(`SELECT vlr.*, f.name as facility_name, p.name as organizer_name
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             JOIN profiles p ON vlr.organizer_id = p.id
             WHERE f.owner_id = $1 ORDER BY vlr.created_at DESC`, [user.sub || user.id]);
        res.json(result.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST Venue Rental Requests
router.post('/requests', auth_1.requireAuth, async (req, res) => {
    const { facility_id, requested_slots } = req.body;
    const organizer_id = req.user.sub || req.user.id;
    // Quick validation array
    if (!facility_id || !organizer_id || !requested_slots) {
        res.status(400).json({ error: 'Missing core lease mapping bounds.' });
        return;
    }
    try {
        const result = await db_1.default.query(`INSERT INTO venue_lease_requests (facility_id, organizer_id, requested_slots) 
             VALUES ($1, $2, $3) RETURNING *`, [facility_id, organizer_id, JSON.stringify(requested_slots)]);
        // Fetch Facility Owner to notify them natively
        const ownerQ = await db_1.default.query(`SELECT owner_id, name FROM facilities WHERE id = $1`, [facility_id]);
        if (ownerQ.rows.length > 0) {
            await (0, notifications_1.createNotification)(db_1.default, {
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT Approve/Reject Lease
router.put('/requests/:id/:action', auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const action = req.params.action;
    const status = action.toUpperCase() + 'ED';
    const auth_user = req.user.sub || req.user.id;
    if (['APPROVED', 'REJECTED'].indexOf(status) === -1) {
        return res.status(400).json({ error: 'Invalid action.' });
    }
    try {
        await db_1.default.query('BEGIN');
        // 1. Lock the lease request row & get facility info
        const leaseQuery = await db_1.default.query(`SELECT vlr.*, f.owner_id 
             FROM venue_lease_requests vlr
             JOIN facilities f ON vlr.facility_id = f.id
             WHERE vlr.id = $1 FOR UPDATE`, [id]);
        if (leaseQuery.rows.length === 0) {
            await db_1.default.query('ROLLBACK');
            return res.status(404).json({ error: 'Lease request not found.' });
        }
        const lease = leaseQuery.rows[0];
        // Verify ownership and state
        if (lease.owner_id !== auth_user) {
            await db_1.default.query('ROLLBACK');
            return res.status(403).json({ error: 'Unauthorized to modify this facility.' });
        }
        if (lease.status !== 'PENDING') {
            await db_1.default.query('ROLLBACK');
            return res.status(400).json({ error: 'Request is no longer pending.' });
        }
        // 2. Perform actual slot reservation constraints
        if (status === 'APPROVED') {
            // Find what date was requested
            const requestedSlots = lease.requested_slots || {};
            const requestedDate = requestedSlots.date;
            if (requestedDate) {
                // Lock slots for that facility on that exact date
                const slotsToLock = await db_1.default.query(`SELECT s.id, s.status 
                     FROM slots s
                     JOIN courts c ON s.court_id = c.id
                     WHERE c.facility_id = $1
                       AND s.start_time >= $2::timestamp 
                       AND s.start_time < ($2::timestamp + interval '1 day')
                     FOR UPDATE`, [lease.facility_id, requestedDate]);
                // Verify every slot in the list is still available
                const unavailableSlots = slotsToLock.rows.filter(s => s.status !== 'available');
                if (unavailableSlots.length > 0) {
                    await db_1.default.query('ROLLBACK');
                    return res.status(409).json({ error: 'Cannot approve lease because some slots are no longer available (actively booked).' });
                }
                // Update requested slots back to booked/reserved vocabulary (status: 'booked')
                if (slotsToLock.rows.length > 0) {
                    const slotIds = slotsToLock.rows.map(s => s.id);
                    await db_1.default.query(`UPDATE slots SET status = 'booked', updated_at = now() WHERE id = ANY($1)`, [slotIds]);
                }
            }
        }
        // Finally, update lease request
        const leaseResp = await db_1.default.query(`UPDATE venue_lease_requests SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
        await db_1.default.query('COMMIT');
        await (0, notifications_1.createNotification)(db_1.default, {
            recipientId: lease.organizer_id,
            actorId: auth_user,
            type: status === 'APPROVED' ? 'LEASE_APPROVED' : 'LEASE_REJECTED',
            title: `Lease Request ${status}`,
            message: `Your requested venue rental has been ${status.toLowerCase()}.`,
            entityType: 'VENUE_LEASE_REQUEST',
            entityId: id
        });
        res.json({ success: true, lease: leaseResp.rows[0] });
    }
    catch (e) {
        await db_1.default.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
