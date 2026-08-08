import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
