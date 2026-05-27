import { execa } from 'execa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DATABASE_URL = 'postgresql://emitsignal:emitsignal@localhost:5432/emitsignal_test';
const POSTGRES_ADMIN_URL = 'postgresql://emitsignal:emitsignal@localhost:5432/postgres';

const DOCKER_COMPOSE_FILE = path.resolve(
    __dirname,
    '../../packages/emitsignal-docker/docker-compose.dev.yml',
);

async function globalSetup() {
    console.log('[setup] starting postgres...');

    await execa(
        'docker',
        ['compose', '-f', DOCKER_COMPOSE_FILE, 'up', '-d', 'postgres', 'redis', '--wait'],
        {
            stderr: 'inherit',
            stdout: 'inherit',
        },
    );

    await execa('psql', [POSTGRES_ADMIN_URL, '-c', 'CREATE DATABASE emitsignal_test']).catch(
        () => null,
    );

    console.log('[setup] pushing Prisma schema to test database...');

    await execa('bunx', ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss'], {
        cwd: path.resolve(__dirname, '../emitsignal-server'),
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stderr: 'inherit',
        stdout: 'inherit',
    });

    console.log('[setup] database ready');
}

export default globalSetup;
