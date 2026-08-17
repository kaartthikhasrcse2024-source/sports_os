"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// GET / => fetch all sorted organically
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.sub || req.user.id;
    try {
        const result = await db_1.default.query(`SELECT * FROM notifications 
             WHERE recipient_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`, [userId]);
        res.json(result.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /unread-count
router.get('/unread-count', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.sub || req.user.id;
    try {
        const result = await db_1.default.query(`SELECT count(id) FROM notifications WHERE recipient_id = $1 AND is_read = false`, [userId]);
        res.json({ unreadCount: parseInt(result.rows[0].count) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /:id/read
router.put('/:id/read', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.sub || req.user.id;
    const { id } = req.params;
    try {
        // Identity bound natively enforcing isolation mappings against targeted updates
        const result = await db_1.default.query(`UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING id`, [id, userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Notification block missing or forbidden' });
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /read-all
router.put('/read-all', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.sub || req.user.id;
    try {
        await db_1.default.query(`UPDATE notifications SET is_read = true WHERE recipient_id = $1`, [userId]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
