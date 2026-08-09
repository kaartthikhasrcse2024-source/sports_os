"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
async function runYieldMigration() {
    const schemaPath = path_1.default.join(__dirname, '../../yield-schema.sql');
    const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
    console.log('Running Yield Pricing Migration...');
    try {
        await db_1.default.query(sql);
        console.log('Yield Migration completed successfully.');
    }
    catch (err) {
        console.error('Migration failed:', err);
    }
    finally {
        db_1.default.end();
    }
}
runYieldMigration();
