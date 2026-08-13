import pool from './src/db';
import { randomUUID } from 'crypto';

async function seedVenues() {
    console.log('🌍 Initializing Geospatial Ecosystem Coordinates...');
    const ownerId = "11111111-1111-1111-1111-111111111111"; // Fallback Mock ID 
    const orgId = "11111111-1111-1111-1111-111111111111";

    try {
        // Ensure mock actors exist for foreign keys trivially
        await pool.query(`INSERT INTO profiles (id, email, name, user_role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [ownerId, 'owner@mock.ny', 'NY Turf Owner', 'TURF_OWNER']);

        // Map realistic NYC Coordinates
        const turfs = [
            { name: 'Manhattan Gridiron', lat: 40.7580, lng: -73.9855, tags: ['turf', 'futsal'], sport: 'futsal', basePrice: 12000 },
            { name: 'Brooklyn Hoops', lat: 40.6782, lng: -73.9442, tags: ['indoor', 'basketball'], sport: 'basketball', basePrice: 6500 },
            { name: 'Queens Racket Club', lat: 40.7282, lng: -73.7949, tags: ['tennis', 'outdoor'], sport: 'tennis', basePrice: 5000 },
            { name: 'Bronx Turf Complex', lat: 40.8448, lng: -73.8648, tags: ['soccer', 'grass'], sport: 'futsal', basePrice: 8000 },
            { name: 'Hoboken Riverfront Court', lat: 40.7439, lng: -74.0324, tags: ['basketball', 'outdoor'], sport: 'basketball', basePrice: 3500 },
            { name: 'Jersey City Squash', lat: 40.7178, lng: -74.0431, tags: ['squash', 'indoor'], sport: 'badminton', basePrice: 4000 },
            { name: 'Staten Island Base', lat: 40.5795, lng: -74.1502, tags: ['futsal', 'indoor'], sport: 'futsal', basePrice: 7000 },
            { name: 'Flushing Meadows Courts', lat: 40.7397, lng: -73.8408, tags: ['tennis'], sport: 'tennis', basePrice: 15000 }
        ];

        let i = 0;
        const facIds: string[] = [];
        for (const t of turfs) {
            const fac = await pool.query(
                `INSERT INTO facilities (owner_id, name, address, location, tags, lat, lng) 
                 VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $5, $4) RETURNING id`,
                [ownerId, t.name, t.name + ' NYC Address ' + i, t.lng, t.lat, JSON.stringify(t.tags)]
            );
            const facilityId = fac.rows[0].id;
            facIds.push(facilityId);

            // Seed Sub-court
            await pool.query(
                `INSERT INTO courts (facility_id, name, sport_type, price_per_hour) 
                 VALUES ($1, $2, $3, $4)`,
                [facilityId, 'Primary Sector', t.sport, t.basePrice]
            );
            i++;
        }

        // 3 Tournaments globally spanning coordinates implicitly
        await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date, status, entry_fee) 
             VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', 'registration_open', $5)`,
            [facIds[0], 'Manhattan Midnight Futsal Cup', 'single_elim', 16, 20000]
        );
        await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date, status, entry_fee) 
             VALUES ($1, $2, $3, $4, NOW() + INTERVAL '3 days', 'in_progress', $5)`,
            [facIds[1], 'Brooklyn Nets Amateur League', 'round_robin', 8, 15000]
        );
        await pool.query(
            `INSERT INTO tournaments (facility_id, name, format, max_teams, start_date, status, entry_fee) 
             VALUES ($1, $2, $3, $4, NOW() + INTERVAL '14 days', 'registration_open', $5)`,
            [facIds[2], 'Queens Grand Slam Open', 'single_elim', 32, 50000]
        );

        console.log('✅ 8 Geographical Venues & 3 Tournaments firmly injected into the Grid.');
    } catch (e: any) {
        console.error('Crash bounding seeds:', e.message);
    }

    pool.end();
}
seedVenues();
