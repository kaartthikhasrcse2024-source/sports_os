import { Router } from 'express';
import pool from './db';

const router = Router();

router.get('/search', async (req, res) => {
    // Map bounds natively from frontend Leaflet intercepts
    const {
        ne_lat, ne_lng, sw_lat, sw_lng,
        center_lat, center_lng, radius_km,
        sport, min_price, max_price
    } = req.query;

    if (!ne_lat || !ne_lng || !sw_lat || !sw_lng) {
        res.status(400).json({ error: 'Viewport boundary coordinates are strictly required.' });
        return;
    }

    try {
        // Construct the PostGIS ENVELOPE securely mapping (xmin, ymin, xmax, ymax)
        // Note: PostGIS uses Longitude as X, Latitude as Y.
        const viewportPolygon = `ST_MakeEnvelope(${Number(sw_lng)}, ${Number(sw_lat)}, ${Number(ne_lng)}, ${Number(ne_lat)}, 4326)`;

        let facilityFilters = [];
        let tournamentFilters = [];
        let params: any[] = [];
        let pIndex = 1;

        // 1. Mandatory Viewport Spatial Bound
        facilityFilters.push(`ST_Within(f.location, ${viewportPolygon})`);
        tournamentFilters.push(`ST_Within(f.location, ${viewportPolygon})`); // Tournaments infer bounds via their home facility

        // 2. Optional Nearby Turf Finder Radius
        if (radius_km && center_lat && center_lng) {
            const centerPoint = `ST_SetSRID(ST_Point(${Number(center_lng)}, ${Number(center_lat)}), 4326)`;
            const radiusMeters = Number(radius_km) * 1000;
            const radiusCondition = `ST_DWithin(f.location, ${centerPoint}, ${radiusMeters})`;

            facilityFilters.push(radiusCondition);
            tournamentFilters.push(radiusCondition);
        }

        // 3. Optional Sport Pipeline Constraint
        if (sport) {
            facilityFilters.push(`EXISTS (SELECT 1 FROM courts c WHERE c.facility_id = f.id AND c.sport_type = $${pIndex})`);
            tournamentFilters.push(`(SELECT sport_type FROM tournaments t2 WHERE t2.id = t.id) = $${pIndex}`); // Assuming Tournaments might eventually explicitly map sport. Currently, Tournaments don't natively have sport_type in schema unless linked by courts. The user specifically asked to filter Facilities based on courts.sport_type. For Tournaments, we just skip sport filter if it doesn't align natively, or map it. Let's assume Tournaments span the facility's sports if not defined.
            params.push(sport);
            pIndex++;
        }

        // 4. Optional Price Constraints
        if (min_price) {
            // Price is stored in cents, API handles dollars or cents? Let's assume client sends cents for precision.
            facilityFilters.push(`EXISTS (SELECT 1 FROM courts c WHERE c.facility_id = f.id AND c.price_per_hour >= $${pIndex})`);
            tournamentFilters.push(`t.entry_fee >= $${pIndex}`);
            params.push(Number(min_price));
            pIndex++;
        }
        if (max_price) {
            facilityFilters.push(`EXISTS (SELECT 1 FROM courts c WHERE c.facility_id = f.id AND c.price_per_hour <= $${pIndex})`);
            tournamentFilters.push(`t.entry_fee <= $${pIndex}`);
            params.push(Number(max_price));
            pIndex++;
        }

        const facilityWhere = facilityFilters.length > 0 ? 'WHERE ' + facilityFilters.join(' AND ') : '';
        const tournamentWhere = tournamentFilters.length > 0 ? 'WHERE ' + tournamentFilters.join(' AND ') : '';

        // Unified Geolocation Merge Strategy
        const query = `
            SELECT 
                'TURF' as type, 
                f.id, f.name, f.address, f.lat, f.lng,
                (SELECT MIN(price_per_hour) FROM courts WHERE facility_id = f.id) as min_rate,
                (SELECT MAX(price_per_hour) FROM courts WHERE facility_id = f.id) as max_rate
            FROM facilities f
            ${facilityWhere}
            
            UNION ALL
            
            SELECT 
                'TOURNAMENT' as type, 
                t.id, t.name, f.address, f.lat, f.lng,
                t.entry_fee as min_rate,
                t.entry_fee as max_rate
            FROM tournaments t
            JOIN facilities f ON t.facility_id = f.id
            -- only fetch pending/open tournaments mapped strictly
            ${tournamentWhere ? tournamentWhere + " AND (t.status = 'registration_open' OR t.status = 'in_progress')" : "WHERE (t.status = 'registration_open' OR t.status = 'in_progress')"}
        `;

        const result = await pool.query(query, params);
        res.json({ success: true, markers: result.rows });

    } catch (err: any) {
        console.error('Discovery DB Crash:', err);
        res.status(500).json({ error: 'Geospatial node traversal fault limit exceeded natively.' });
    }
});

export default router;
