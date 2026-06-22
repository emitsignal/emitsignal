#!/usr/bin/env bun
/**
 * Restore the PostgreSQL database from a dump stored in Cloudflare R2.
 *
 *   bun infra/db-restore.ts                 # restore the most recent backup
 *   bun infra/db-restore.ts <object-key>    # restore a specific backup
 *   bun infra/db-restore.ts --list          # list available backups
 *   bun infra/db-restore.ts <key> --yes     # skip the confirmation prompt
 *
 * This DROPS and recreates objects in the target database (pg_restore --clean
 * --if-exists), so it prompts for confirmation unless --yes is passed.
 */

import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { BackupConfig } from './lib/config';

import { createR2Client, loadConfig } from './lib/config';
import { restoreDatabase } from './lib/postgres';

interface ParsedArguments {
    key: null | string;
    list: boolean;
    yes: boolean;
}

async function confirm(prompt: string): Promise<boolean> {
    process.stdout.write(prompt);

    for await (const line of console) {
        return line.trim().toLowerCase() === 'yes';
    }

    return false;
}

async function listBackups(config: BackupConfig): Promise<string[]> {
    const client = createR2Client(config);
    const response = await client.list({ prefix: `${config.prefix}/` });

    return (response.contents ?? [])
        .map((entry) => entry.key)
        .filter((key): key is string => typeof key === 'string')
        .sort();
}

async function main(): Promise<void> {
    const config = await loadConfig();
    const args = parseArguments(Bun.argv.slice(2));

    if (args.list) {
        const keys = await listBackups(config);

        if (keys.length === 0) {
            console.log(`No backups found under r2://${config.bucket}/${config.prefix}/`);

            return;
        }

        console.log(`Backups in r2://${config.bucket}/${config.prefix}/:`);

        for (const key of keys) {
            console.log(`  ${key}`);
        }

        return;
    }

    let objectKey = args.key;

    if (!objectKey) {
        const keys = await listBackups(config);

        if (keys.length === 0) {
            throw new Error(`No backups found under r2://${config.bucket}/${config.prefix}/`);
        }

        objectKey = keys[keys.length - 1] ?? null;

        if (!objectKey) {
            throw new Error('Could not determine the latest backup.');
        }

        console.log(`ℹ️  No key given — restoring latest: ${objectKey}`);
    }

    const databaseName = new URL(config.databaseUrl).pathname.replace(/^\//, '');

    if (!args.yes) {
        const confirmed = await confirm(
            `⚠️  This will OVERWRITE database "${databaseName}" with ${objectKey}.\n` +
                `   Type "yes" to continue: `,
        );

        if (!confirmed) {
            console.log('Aborted.');
            return;
        }
    }

    const localPath = join(tmpdir(), `emitsignal-restore-${Date.now()}.dump`);

    console.log(`⬇️  Downloading r2://${config.bucket}/${objectKey}…`);

    const client = createR2Client(config);
    const remoteFile = client.file(objectKey);

    if (!(await remoteFile.exists())) {
        throw new Error(`Backup not found: ${objectKey}`);
    }

    await Bun.write(localPath, remoteFile);

    console.log(`♻️  Restoring into "${databaseName}" via ${config.postgresImage}…`);

    try {
        await restoreDatabase({
            databaseUrl: config.databaseUrl,
            inputPath: localPath,
            postgresImage: config.postgresImage,
        });
    } finally {
        await unlink(localPath).catch(() => {});
    }

    console.log('✅ Restore complete.');
}

function parseArguments(argv: string[]): ParsedArguments {
    const parsed: ParsedArguments = { key: null, list: false, yes: false };

    for (const argument of argv) {
        if (argument === '--list') {
            parsed.list = true;
        } else if (argument === '--yes' || argument === '-y') {
            parsed.yes = true;
        } else if (!argument.startsWith('-')) {
            parsed.key = argument;
        }
    }

    return parsed;
}

main().catch((error) => {
    console.error(`❌ Restore failed: ${error instanceof Error ? error.message : String(error)}`);

    process.exit(1);
});
