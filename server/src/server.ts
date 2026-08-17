import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { requireAuth } from './auth';
import pool from './db';
import bookingRoutes from './booking';
import './cleanup'; // initialize cron job

import { groupBookingQueue } from './queue';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullMQAdapter(groupBookingQueue)],
    serverAdapter: serverAdapter,
});

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: allowedOrigins
}));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use(express.json());

app.use('/api/v1/bookings', bookingRoutes);
app.use('/admin/queues', serverAdapter.getRouter());

import facilityRoutes from './facilities';
app.use('/api/v1/facilities', facilityRoutes);

import tournamentRoutes from './tournaments';
app.use('/api/v1/tournaments', tournamentRoutes);

import refereeRoutes from './referees';
app.use('/api/v1/referees', refereeRoutes);

import playerRoutes from './players';
app.use('/api/v1/players', playerRoutes);

app.get('/api/profile', requireAuth, async (req, res) => {
    const user = (req as any).user;
    try {
        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [user.sub]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

import scoutRoutes from './scout';
app.use('/api/v1/scout', scoutRoutes);

import ownerRoutes from './owner';
app.use('/api/v1/owner', ownerRoutes);

import organizerRoutes from './organizer';
app.use('/api/v1/organizer', organizerRoutes);

import playerRoutesServer from './player';
app.use('/api/v1/player', playerRoutesServer);

import verificationRoutes from './verification';
app.use('/api/v1/verification', verificationRoutes);

import registrationRoutes from './registration';
app.use('/api/v1/registration', registrationRoutes);

import venueRoutes from './venues';
app.use('/api/v1/venues', venueRoutes);

import escrowRoutes from './escrow';
app.use('/api/v1/escrow', escrowRoutes);

import leaseRoutes from './leases';
app.use('/api/v1/leases', requireAuth, leaseRoutes);

import paymentRoutes from './payments';
app.use('/api/v1/payments', paymentRoutes);

import notificationRoutes from './notifications';
app.use('/api/v1/notifications', notificationRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
