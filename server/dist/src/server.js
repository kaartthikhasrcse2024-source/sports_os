"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./auth");
const db_1 = __importDefault(require("./db"));
const booking_1 = __importDefault(require("./booking"));
require("./cleanup"); // initialize cron job
const queue_1 = require("./queue");
const api_1 = require("@bull-board/api");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_2 = require("@bull-board/express");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const serverAdapter = new express_2.ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
(0, api_1.createBullBoard)({
    queues: [new bullMQAdapter_1.BullMQAdapter(queue_1.groupBookingQueue)],
    serverAdapter: serverAdapter,
});
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins
}));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use(express_1.default.json());
app.use('/api/v1/bookings', booking_1.default);
app.use('/admin/queues', serverAdapter.getRouter());
const facilities_1 = __importDefault(require("./facilities"));
app.use('/api/v1/facilities', facilities_1.default);
const tournaments_1 = __importDefault(require("./tournaments"));
app.use('/api/v1/tournaments', tournaments_1.default);
const referees_1 = __importDefault(require("./referees"));
app.use('/api/v1/referees', referees_1.default);
const players_1 = __importDefault(require("./players"));
app.use('/api/v1/players', players_1.default);
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
