"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("./db"));
const router = (0, express_1.Router)();
router.get('/nearby', async (req, res) => {
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
        const params = [pointWKT, Number(radius_km) * 1000];
        if (tags && tags !== '[]') {
            const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            query += ` AND tags @> $${params.length + 1}::jsonb`;
            params.push(JSON.stringify(parsedTags));
        }
        query += ` ORDER BY distance_meters ASC`;
        const result = await db_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching nearby facilities:', err);
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
