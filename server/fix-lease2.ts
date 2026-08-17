import pool from './src/db';
import fs from 'fs';
import path from 'path';

async function fix() {
    try {
        const res = await pool.query('SELECT id FROM facilities LIMIT 1');
        const id = res.rows[0]?.id;
        if (!id) {
            console.error("NO FACILITIES FOUND IN DB! Inserting a mock facility...");
            const mockId = '8f3a388f-7c61-45bd-85b2-3f193850cb17';
            await pool.query(`
                INSERT INTO facilities (id, name, location, owner_id)
                VALUES ($1, 'Mock Arena', 'Chennai', 'e2adeba0-afff-423a-9369-1edb653ad019')
                ON CONFLICT (id) DO NOTHING
            `, [mockId]);
            const p = path.resolve('../client/src/pages/OrganizerDashboard.tsx');
            let code = fs.readFileSync(p, 'utf8');
            code = code.replace(/facility_id: 'dummy'/g, `facility_id: '${mockId}'`);
            code = code.replace(/facility_id: '8f3a388f-7c61-45bd-85b2-3f193850cb17'/g, `facility_id: '${mockId}'`);
            fs.writeFileSync(p, code);
            console.log("Inserted mock facility and fixed dashboard with:", mockId);
        } else {
            const p = path.resolve('../client/src/pages/OrganizerDashboard.tsx');
            let code = fs.readFileSync(p, 'utf8');
            code = code.replace(/facility_id: 'dummy'/g, `facility_id: '${id}'`);
            code = code.replace(/facility_id: '8f3a388f-7c61-45bd-85b2-3f193850cb17'/g, `facility_id: '${id}'`);
            fs.writeFileSync(p, code);
            console.log("Fixed dashboard with live ID:", id);
        }
    } catch (e) { console.error(e) }
    process.exit(0);
}
fix();
