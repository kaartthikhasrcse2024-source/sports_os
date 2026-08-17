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
        const { organizer_name, phone_number, organization_name, organization_type, registration_number, tournament_experience, operating_location } = req.body;
        const errors = {};
        if (!organizer_name || typeof organizer_name !== 'string' || organizer_name.trim() === '')
            errors.organizer_name = 'Required';
        if (!phone_number || typeof phone_number !== 'string' || phone_number.trim() === '')
            errors.phone_number = 'Required';
        if (!organization_name || typeof organization_name !== 'string' || organization_name.trim() === '')
            errors.organization_name = 'Required';
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'VALIDATION_ERROR', fields: errors });
        }
        const profileRes = await db_1.default.query(`SELECT id, role, user_role FROM profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
        }
        const profile = profileRes.rows[0];
        // Safely extract the raw role (handle old/new structure gracefully against DB enum variations).
        const rawRole = profile.user_role || profile.role || '';
        if (rawRole.toUpperCase() !== 'TOURNAMENT_ORGANIZER') {
            return res.status(403).json({ error: 'TOURNAMENT_ORGANIZER_ROLE_REQUIRED' });
        }
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            const regRes = await client.query(`
                INSERT INTO organizer_registrations (
                    user_id, organizer_name, phone_number, organization_name, organization_type, registration_number, tournament_experience, operating_location, registration_status, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED', NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    organizer_name = EXCLUDED.organizer_name,
                    phone_number = EXCLUDED.phone_number,
                    organization_name = EXCLUDED.organization_name,
                    organization_type = EXCLUDED.organization_type,
                    registration_number = EXCLUDED.registration_number,
                    tournament_experience = EXCLUDED.tournament_experience,
                    operating_location = EXCLUDED.operating_location,
                    registration_status = 'SUBMITTED',
                    updated_at = NOW()
                RETURNING *
            `, [userId, organizer_name, phone_number, organization_name, organization_type, registration_number, tournament_experience, operating_location]);
            const updatedProfileRes = await client.query(`
                UPDATE profiles 
                SET full_name = $1, name = $1
                WHERE id = $2
                RETURNING *
            `, [organizer_name, userId]);
            await client.query('COMMIT');
            return res.status(200).json({
                success: true,
                registration: regRes.rows[0],
                profile: updatedProfileRes.rows[0],
                message: "Organizer registration submitted successfully."
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
router.use((0, auth_1.requireRole)(['TOURNAMENT_ORGANIZER']));
exports.default = router;
