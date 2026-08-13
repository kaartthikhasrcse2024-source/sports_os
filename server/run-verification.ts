import pool from './src/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('🚀 Executing Part 2: Verification Unified Schema...');

    // 1. Run the raw SQL schema
    const schemaPath = path.join(__dirname, '../verification-schema.sql');
    try {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Base generic verification_documents schema rigidly mapped!');
    } catch (e: any) {
        console.error('❌ Schema Migration crash:', e);
        process.exit(1);
    }
    await pool.end();
}

runMigration();
