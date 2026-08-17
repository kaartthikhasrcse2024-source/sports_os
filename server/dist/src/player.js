"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
router.post('/registration', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "UNAUTHORIZED" });
        const { name, age, gender, mobile_number, city, area, preferred_sport, playing_position, skill_level } = req.body;
        const errors = {};
        if (!name || typeof name !== 'string' || name.trim() === '')
            errors.name = 'Required';
        if (typeof age !== 'number' || !Number.isInteger(age) || age < 5 || age > 100)
            errors.age = 'Must be an integer between 5 and 100';
        if (!gender || typeof gender !== 'string' || gender.trim() === '')
            errors.gender = 'Required';
        if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim() === '')
            errors.mobile_number = 'Required';
        if (!city || typeof city !== 'string' || city.trim() === '')
            errors.city = 'Required';
        if (!area || typeof area !== 'string' || area.trim() === '')
            errors.area = 'Required';
        if (!preferred_sport || typeof preferred_sport !== 'string' || preferred_sport.trim() === '')
            errors.preferred_sport = 'Required';
        if (!playing_position || typeof playing_position !== 'string' || playing_position.trim() === '')
            errors.playing_position = 'Required';
        if (!skill_level || typeof skill_level !== 'string' || skill_level.trim() === '')
            errors.skill_level = 'Required';
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'VALIDATION_ERROR', fields: errors });
        }
        const profileRes = await db_1.default.query(`SELECT id, role, user_role FROM profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
        }
        const profile = profileRes.rows[0];
        const rawRole = profile.user_role || profile.role || '';
        if (rawRole.toUpperCase() !== 'PLAYER') {
            return res.status(403).json({ error: 'PLAYER_ROLE_REQUIRED' });
        }
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            const regRes = await client.query(`
                INSERT INTO player_registrations (
                    user_id, age, gender, mobile_number, city, area, 
                    preferred_sport, playing_position, skill_level, registration_status, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SUBMITTED', NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    age = EXCLUDED.age,
                    gender = EXCLUDED.gender,
                    mobile_number = EXCLUDED.mobile_number,
                    city = EXCLUDED.city,
                    area = EXCLUDED.area,
                    preferred_sport = EXCLUDED.preferred_sport,
                    playing_position = EXCLUDED.playing_position,
                    skill_level = EXCLUDED.skill_level,
                    registration_status = 'SUBMITTED',
                    updated_at = NOW()
                RETURNING *
            `, [userId, age, gender, mobile_number, city, area, preferred_sport, playing_position, skill_level]);
            const updatedProfileRes = await client.query(`
                UPDATE profiles 
                SET full_name = $1, name = $1, sport_type = $2, position = $3
                WHERE id = $4
                RETURNING *
            `, [name, preferred_sport, playing_position, userId]);
            await client.query('COMMIT');
            return res.status(200).json({
                success: true,
                registration: regRes.rows[0],
                profile: updatedProfileRes.rows[0],
                message: "Player registration submitted successfully."
            });
        }
        catch (dbErr) {
            await client.query('ROLLBACK');
            console.error("Transaction Error:", dbErr);
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
        finally {
            client.release();
        }
    }
    catch (e) {
        console.error("Endpoint Error:", e);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
});
// Restrict all routes to players only
router.use((0, auth_1.requireRole)(['PLAYER']));
router.get('/bookings', async (req, res) => {
    try {
        const playerId = req.user.sub || req.user.id;
        const query = `
            SELECT b.id, b.status, b.total_amount, b.created_at, f.name as facility, c.name as court
            FROM bookings b
            JOIN slots s ON s.id = b.slot_id
            JOIN courts c ON c.id = s.court_id
            JOIN facilities f ON f.id = c.facility_id
            WHERE b.user_id = $1
        `;
        const result = await db_1.default.query(query, [playerId]);
        res.json(result.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/register-turf', async (req, res) => {
    try {
        const playerId = req.user.sub || req.user.id;
        const { facility_id } = req.body;
        if (!facility_id)
            return res.status(400).json({ error: 'facility_id required' });
        await db_1.default.query(`UPDATE profiles SET home_turf_id = $1 WHERE id = $2`, [facility_id, playerId]);
        res.json({ success: true, message: 'My Home Base registered successfully' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/register-home-turf', async (req, res) => {
    try {
        const playerId = req.user.sub || req.user.id;
        const { venueId } = req.body;
        if (!venueId)
            return res.status(400).json({ error: 'venueId required' });
        await db_1.default.query(`UPDATE profiles SET home_turf_id = $1 WHERE id = $2`, [venueId, playerId]);
        res.json({ success: true, message: 'Home Turf registered successfully for ' + playerId });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/athletic-resume', async (req, res) => {
    res.json({ status: 'active', message: 'Verified stats fetched' });
});
exports.default = router;
