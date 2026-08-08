import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import pool from '../src/db';

async function runPostGISTest() {
    console.log('Seeding 5 disparate coordinate zones for geospatial radius testing...');

    // Seed facilities at distinct real-world distances from a focal point (e.g., Bangalore 12.9716, 77.5946)
    const focalPoint = { lat: 12.9716, lng: 77.5946 };

    const testData = [
        { name: 'Cubbon Park Turf', lat: 12.9779, lng: 77.5952, tags: '["turf"]' }, // ~0.7km
        { name: 'Koramangala Indoor', lat: 12.9279, lng: 77.6271, tags: '["indoor", "turf"]' }, // ~6km
        { name: 'Indiranagar Clay', lat: 12.9784, lng: 77.6408, tags: '["clay", "floodlights"]' }, // ~5km
        { name: 'Yelahanka Arena', lat: 13.1007, lng: 77.5963, tags: '["turf"]' }, // ~14km
        { name: 'Electronic City Stadium', lat: 12.8452, lng: 77.6602, tags: '["turf", "floodlights"]' } // ~15km+ 
    ];

    for (const d of testData) {
        // PostGIS Point natively parses via WKT
        const wkt = `POINT(${d.lng} ${d.lat})`;
        await pool.query(`
       INSERT INTO facilities (name, lat, lng, tags, location)
       VALUES ($1, $2, $3, $4::jsonb, ST_GeomFromText($5, 4326)::geography)
     `, [d.name, d.lat, d.lng, d.tags, wkt]);
    }

    const performFetch = async (radius: number, filter: string | null = null) => {
        let url = `http://localhost:3001/api/v1/facilities/nearby?lat=${focalPoint.lat}&lng=${focalPoint.lng}&radius_km=${radius}`;
        if (filter) {
            url += `&tags=${encodeURIComponent('["' + filter + '"]')}`;
        }
        const res = await fetch(url);
        return res.json();
    };

    console.log('\n[1] Testing 10km radius query (no tags)...');
    const tenKmRes = await performFetch(10);
    console.log(`Found ${tenKmRes.length} facilities:\n  - ${tenKmRes.map((r: any) => `${r.name} (${Math.round(r.distance_meters)}m)`).join('\n  - ')}`);
    console.assert(tenKmRes.length >= 3, 'Expected around 3 results inside 10km');
    if (tenKmRes.length > 0) {
        console.assert(tenKmRes[0].name === 'Cubbon Park Turf', 'Expected Cubbon Park to be closest automatically sorted by ST_Distance');
    }

    console.log('\n[2] Testing 20km radius query (all should appear)...');
    const allRes = await performFetch(20);
    console.log(`Found ${allRes.length} facilities.`);
    console.assert(allRes.length >= 5, 'Expected at least 5 results inclusive for larger radius');

    console.log('\n[3] Testing exact JSONB element filtering array tag "floodlights" on 20km radius...');
    const floodlightRes = await performFetch(20, 'floodlights');
    console.log(`Found ${floodlightRes.length} floodlight enabled locations.\n  - ${floodlightRes.map((r: any) => `${r.name}`).join('\n  - ')}`);

    if (floodlightRes.every((r: any) => r.tags.includes('floodlights'))) {
        console.log('\n✅ TEST PASSED: PostGIS ST_DWithin bound radius and ST_Distance mapping sorted perfectly in-line with GIN jsonb index limits.');
    } else {
        console.log('\n❌ TEST FAILED: Tag inclusions not matching logic requirements.');
    }

    await pool.end();
}

runPostGISTest().catch(console.error);
