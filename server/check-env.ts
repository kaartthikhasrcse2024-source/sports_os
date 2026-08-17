import fs from 'fs';
import path from 'path';

function check() {
    try {
        console.log("CLIENT .env");
        console.log(fs.readFileSync(path.resolve(process.cwd(), '../client/.env'), 'utf8'));
    } catch (e) { console.error('No client .env'); }
    try {
        console.log("\nSERVER .env");
        console.log(fs.readFileSync(path.resolve(process.cwd(), '../server/.env'), 'utf8'));
    } catch (e) { console.error('No server .env'); }

    try {
        console.log("\nROOT .env");
        console.log(fs.readFileSync(path.resolve(process.cwd(), '../.env'), 'utf8'));
    } catch (e) { console.error('No root .env'); }
}
check();
