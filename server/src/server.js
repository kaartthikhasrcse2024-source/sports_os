"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth");
const db_1 = __importDefault(require("./db"));
dotenv_1.default.config();
const booking_1 = __importDefault(require("./booking"));
require("./cleanup"); // initialize cron job
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/v1/bookings', booking_1.default);
app.get('/api/profile', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    try {
        const result = await db_1.default.query('SELECT * FROM profiles WHERE id = $1', [user.sub]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=server.js.map