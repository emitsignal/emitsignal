/**
 * Minimal .env loader for the infra scripts.
 *
 * Loads, in priority order (first wins — already-set keys are never overwritten):
 *   1. variables already present in the process environment
 *   2. infra/.env            (backup-specific config + R2 credentials)
 *   3. packages/emitsignal-server/.env  (so DATABASE_URL is reused automatically)
 *
 * We parse by hand instead of pulling in a dependency: a handful of `KEY=VALUE`
 * lines is all we need and the infra scripts must stay zero-install.
 */

import { join } from 'node:path';

const REPOSITORY_ROOT = join(import.meta.dir, '..', '..');

const ENV_FILES = [
    join(REPOSITORY_ROOT, 'infra', '.env'),
    join(REPOSITORY_ROOT, 'packages', 'emitsignal-server', '.env'),
];

function parseEnvFile(contents: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const rawLine of contents.split('\n')) {
        const line = rawLine.trim();

        if (line === '' || line.startsWith('#')) {
            continue;
        }

        const separatorIndex = line.indexOf('=');

        if (separatorIndex === -1) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();

        const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
        const isSingleQuoted = value.startsWith("'") && value.endsWith("'");

        if (isDoubleQuoted || isSingleQuoted) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    }

    return result;
}

let loaded = false;

export async function loadEnvironment(): Promise<void> {
    if (loaded) {
        return;
    }

    for (const path of ENV_FILES) {
        const file = Bun.file(path);

        if (!(await file.exists())) {
            continue;
        }

        const parsed = parseEnvFile(await file.text());

        for (const [key, value] of Object.entries(parsed)) {
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    }

    loaded = true;
}
