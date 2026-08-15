const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("INSERT INTO auth.users (id, email) VALUES ('88888888-0000-0000-0000-000000000007', 'testseed2@example.com') ON CONFLICT DO NOTHING")
    .then(() => console.log('SUCCESS'))
    .catch(e => console.error('ERROR:', e.message))
    .finally(() => p.end());
