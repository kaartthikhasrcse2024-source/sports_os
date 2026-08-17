import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function main() {
    try {
        await client.connect();
        console.log("Connected to the database. Wiping users...");

        // Truncate users which should cascade to all dependent tables
        const result = await client.query('TRUNCATE TABLE auth.users CASCADE');
        console.log(`Successfully truncated auth.users and cascaded data.`);

        // Just in case public.profiles or public.users were not cascaded (no explicit foreign key), we truncate them too
        try {
            await client.query('TRUNCATE TABLE public.profiles CASCADE');
            console.log(`Successfully truncated public.profiles.`);
        } catch (e) {
            // Table might not exist or already cascaded, skip
        }

        try {
            await client.query('TRUNCATE TABLE public.users CASCADE');
            console.log(`Successfully truncated public.users.`);
        } catch (e) {
            // Table might not exist or already cascaded, skip
        }

        console.log("Database wipe complete.");

    } catch (error) {
        console.error("Error wiping out database:", error);
    } finally {
        await client.end();
    }
}

main();
