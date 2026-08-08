import { Router, Request, Response } from 'express';
import pool from './db';

const router = Router();

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
