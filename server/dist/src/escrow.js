"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const queue_1 = require("./queue");
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
router.post('/split-pay', auth_1.requireAuth, (0, auth_1.requireRole)(['PLAYER']), async (req, res) => {
    const { slot_id } = req.body;
    if (!slot_id) {
        res.status(400).json({ error: 'slot_id is required' });
        return;
    }
    try {
        // Create hold
        await db_1.default.query("UPDATE slots SET status = 'held' WHERE id = $1", [slot_id]);
        // Add to bullmq queue for 15 minute delay
        await queue_1.groupBookingQueue.add('checkSplitPay', { slot_id: slot_id }, { delay: 15 * 60 * 1000 });
        res.json({ success: true, message: 'Slot held. 15 minute timer started in queue.' });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// Simulation route to mark the rest of the payments and settle it
router.post('/split-pay/settle', auth_1.requireAuth, (0, auth_1.requireRole)(['PLAYER']), async (req, res) => {
    const { slot_id } = req.body;
    if (!slot_id) {
        res.status(400).json({ error: 'slot_id is required' });
        return;
    }
    try {
        await db_1.default.query("UPDATE slots SET status = 'booked' WHERE id = $1", [slot_id]);
        res.json({ success: true, message: 'Slot fully paid and booked.' });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
exports.default = router;
