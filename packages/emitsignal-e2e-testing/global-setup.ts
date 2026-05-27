import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
    const dbDir = path.resolve(__dirname, '../emitsignal-server/db');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.resolve(dbDir, 'test-e2e.db');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`  [setup] deleted test database at ${dbPath}`);
    }

    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    const serverDir = path.resolve(__dirname, '../emitsignal-server');
    console.log(`  [setup] pushing Prisma schema to test database...`);
    execSync('bun x prisma db push --accept-data-loss --url "file:./db/test-e2e.db"', {
        cwd: serverDir,
        env: { ...process.env },
        stdio: 'inherit',
    });
    console.log(`  [setup] database ready`);
}

export default globalSetup;
