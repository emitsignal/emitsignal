import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalTeardown() {
    const dbPath = path.resolve(__dirname, '../emitsignal-server/db/test-e2e.db');

    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

export default globalTeardown;
