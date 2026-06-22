#!/usr/bin/env bun
/**
 * Dump the PostgreSQL database (custom format) and upload it to Cloudflare R2.
 *
 *   bun infra/db-backup.ts
 *
 * The dump is written to a local temp file, streamed up to R2 under
 * BACKUP_PREFIX, then removed. The object key is printed on success — pass it to
 * db-restore.ts to roll back.
 */

import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createR2Client, loadConfig } from './lib/config';
import { dumpDatabase } from './lib/postgres';

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
}

async function main(): Promise<void> {
    const config = await loadConfig();

    const databaseName = new URL(config.databaseUrl).pathname.replace(/^\//, '') || 'database';
    const objectKey = `${config.prefix}/${databaseName}-${timestamp()}.dump`;
    const localPath = join(tmpdir(), `emitsignal-backup-${timestamp()}.dump`);

    console.log(`📦 Dumping "${databaseName}" via ${config.postgresImage}…`);

    await dumpDatabase({
        databaseUrl: config.databaseUrl,
        outputPath: localPath,
        postgresImage: config.postgresImage,
    });

    const dumpFile = Bun.file(localPath);
    const size = dumpFile.size;

    if (size === 0) {
        await unlink(localPath).catch(() => {});
        throw new Error('Dump is empty — aborting upload.');
    }

    console.log(`⬆️  Uploading ${formatBytes(size)} to r2://${config.bucket}/${objectKey}…`);

    const client = createR2Client(config);

    await client.file(objectKey).write(dumpFile, { type: 'application/octet-stream' });

    await unlink(localPath).catch(() => {});

    console.log('✅ Backup complete.');
    console.log(`   key: ${objectKey}`);
    console.log(`   restore with: bun infra/db-restore.ts ${objectKey}`);
}

function timestamp(): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');

    return (
        `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
        `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
    );
}

main().catch((error) => {
    console.error(`❌ Backup failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
