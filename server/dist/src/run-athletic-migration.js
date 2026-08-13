"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
async function runMigration() {
    const client = await db_1.default.connect();
    try {
        console.log('Running athletic schema migration...');
        const schemaPath = path_1.default.join(__dirname, '../../athletic-schema.sql');
        const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Athletic schema migration completed successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Athletic schema migration failed:', error);
        process.exit(1);
    }
    finally {
        client.release();
        process.exit(0);
    }
}
runMigration();
