import { Router, Request, Response } from 'express';
import pool from './db';
import { requireVerifiedRole } from './auth';

const router = Router();

router.post('/', requireVerifiedRole(['TURF_OWNER']), async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, address, lat, lng, is_outdoor, tags } = req.body;

    if (!name || !lat || !lng) {
        res.status(400).json({ error: 'Missing required boundary fields: name, lat, lng' });
        return;
    }

    try {
        const pointWKT = `POINT(${lng} ${lat})`;
        const result = await pool.query(
            `INSERT INTO facilities (name, address, owner_id, lat, lng, location, is_outdoor, tags)
             VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7, $8)
             RETURNING *`,
            [name, address, user.sub || user.id, lat, lng, pointWKT, is_outdoor || false, JSON.stringify(tags || {})]
        );
        res.json({ success: true, facility: result.rows[0] });
    } catch (e: any) {
        console.error('Facility Creation Error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM facilities ORDER BY name ASC');
        res.json(result.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/nearby', async (req: Request, res: Response) => {
    const { lat, lng, radius_km = 10, tags } = req.query;

    if (!lat || !lng) {
        res.status(400).json({ error: 'Missing lat/lng' });
        return;
    }

    try {
        const pointWKT = `POINT(${lng} ${lat})`;
        let query = `
            SELECT id, name, address, lat, lng, tags, 
            ST_Distance(location, ST_GeomFromText($1, 4326)::geography) as distance_meters
            FROM facilities
            WHERE ST_DWithin(location, ST_GeomFromText($1, 4326)::geography, $2)
        `;
        const params: any[] = [pointWKT, Number(radius_km) * 1000];

        if (tags && tags !== '[]') {
            const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            query += ` AND tags @> $${params.length + 1}::jsonb`;
            params.push(JSON.stringify(parsedTags));
        }

        query += ` ORDER BY distance_meters ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error('Error fetching nearby facilities:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
