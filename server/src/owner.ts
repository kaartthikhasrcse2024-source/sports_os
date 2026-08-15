import { Router } from 'express';
import pool from './db';
import { requireRole } from './auth';

const router = Router();

// Restrict all routes to venue_owner only
router.use(requireRole(['venue_owner']));

// Generate full 6 AM to 11 PM schedule for Field 1 and Field 2
let mockSlots: any[] = [];
let idCounter = 1000;

for (let field of ['Field 1', 'Field 2']) {
    for (let hour = 6; hour <= 23; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const ampm = hour < 12 ? 'AM' : (hour === 12 ? 'PM' : 'PM');
        const displayHr = hour <= 12 ? hour : hour - 12;
        const displayTime = `${timeStr} (${displayHr} ${ampm})`;

        let status = 'AVAILABLE';
        let price = (hour >= 17) ? 1600 : 1200; // Peak from 5 PM
        let tx = undefined;
        let title = undefined;
        let id = (idCounter++).toString();

        // Inject mock scenarios
        if (field === 'Field 1' && hour === 19) {
            id = '4092';
            status = 'HELD_PENDING';
            title = 'Ashwin Kumar Split Group';
        } else if (field === 'Field 1' && hour === 20) {
            status = 'CONFIRMED_BOOKED';
            tx = 'CHN-UPI-99412';
        } else if (field === 'Field 2' && hour >= 9 && hour <= 13) {
            status = 'LOCKED';
            title = 'Weekend Organizer League';
        }

        mockSlots.push({ id, field, time: displayTime, status, price, tx, title });
    }
}

router.get('/slots', async (req, res) => {
    try {
        res.json(mockSlots);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/slots/override', async (req, res) => {
    try {
        const { id, lock } = req.body;
        const slot = mockSlots.find(s => s.id === id);
        if (slot) {
            slot.status = lock ? 'MAINTENANCE' : 'AVAILABLE';
        }
        res.json({ success: true, slot });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/roster', async (req, res) => {
    try {
        // Return only the exact 3 specified players mapped to CHN-OWN-01 natively
        res.json([
            { id: 'CHN-PLY-101', name: 'Ashwin Kumar', location: 'Velachery', preferred: 'Football', games: 14 },
            { id: 'CHN-PLY-103', name: 'Mohamed Riyas', location: 'Triplicane', preferred: 'Football/Box Cricket', games: 22 },
            { id: 'CHN-PLY-105', name: 'Pradeep Chandran', location: 'T. Nagar', preferred: 'Box Cricket', games: 9 }
        ]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/roster/draft-team', async (req, res) => {
    try {
        const { teamName, playerIds } = req.body;
        // Simulate sending push notifications to apps using Capacitor
        res.json({ success: true, message: `Successfully formed team ${teamName} and dispatched push notifications to ${playerIds.length} players!` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/tournaments', async (req, res) => {
    res.json({ success: true, message: 'Tournament created via authorized owner' });
});

router.get('/analytics', async (req, res) => {
    res.json({ occupancyRate: '85%', dailyRevenue: 1200 });
});

export default router;
