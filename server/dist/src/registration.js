"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
router.get('/status', auth_1.requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const userId = user.sub || user.id;
        let rawRole = user.user_metadata?.role || user.app_metadata?.role;
        if (user.role && user.role !== 'authenticated' && user.role !== 'anon')
            rawRole = rawRole || user.role;
        const role = (0, auth_1.normalizeRole)(rawRole || 'PLAYER');
        let tableName = '';
        if (role === 'PLAYER') {
            tableName = 'player_registrations';
        }
        else if (role === 'TURF_OWNER') {
            tableName = 'turf_owner_registrations';
        }
        else if (role === 'TOURNAMENT_ORGANIZER') {
            tableName = 'organizer_registrations';
        }
        else {
            // For admin/referee or other roles not strictly requiring these tables yet.
            res.json({
                registrationComplete: true,
                registrationStatus: 'APPROVED'
            });
            return;
        }
        const result = await db_1.default.query(`SELECT registration_status FROM ${tableName} WHERE user_id = $1`, [userId]);
        if (result.rows.length === 0) {
            res.json({
                registrationComplete: false,
                registrationStatus: 'INCOMPLETE'
            });
        }
        else {
            const status = result.rows[0].registration_status;
            res.json({
                registrationComplete: status === 'APPROVED' || status === 'SUBMITTED',
                registrationStatus: status
            });
        }
    }
    catch (e) {
        console.error('Error fetching registration status:', e);
        res.status(500).json({ error: 'Failed to fetch registration status' });
    }
});
exports.default = router;
