/**
 * Typed configuration for the infra database backup/restore scripts.
 *
 * Reuses the same `S3_*` credentials the server uses for Cloudflare R2 (see
 * `packages/emitsignal-server/src/lib/storage/s3-provider.ts`). Backups land in
 * `BACKUP_BUCKET` (defaults to the private bucket) under `BACKUP_PREFIX`.
 */

import { loadEnvironment } from './env';

export interface BackupConfig {
    bucket: string;
    databaseUrl: string;
    postgresImage: string;
    prefix: string;
    r2: R2Credentials;
}

export interface R2Credentials {
    accessKeyId: string;
    endpoint: string;
    region: string;
    secretAccessKey: string;
}

export function createR2Client(config: BackupConfig, bucket?: string): Bun.S3Client {
    return new Bun.S3Client({
        accessKeyId: config.r2.accessKeyId,
        bucket: bucket ?? config.bucket,
        endpoint: config.r2.endpoint,
        region: config.r2.region,
        secretAccessKey: config.r2.secretAccessKey,
    });
}

export async function loadConfig(): Promise<BackupConfig> {
    await loadEnvironment();

    const r2: R2Credentials = {
        accessKeyId: required('S3_ACCESS_KEY_ID'),
        endpoint: required('S3_ENDPOINT'),
        // R2 ignores the region but the S3 protocol requires one; "auto" is the R2 convention.
        region: optional('S3_REGION', 'auto'),
        secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    };

    return {
        bucket: optional('BACKUP_BUCKET', required('S3_PRIVATE_BUCKET_NAME')),
        databaseUrl: required('DATABASE_URL'),
        postgresImage: optional('POSTGRES_IMAGE', 'postgres:16-alpine'),
        prefix: optional('BACKUP_PREFIX', 'db-backups').replace(/\/+$/, ''),
        r2,
    };
}

function optional(name: string, fallback: string): string {
    const value = process.env[name];

    return value === undefined || value.trim() === '' ? fallback : value;
}

function required(name: string): string {
    const value = process.env[name];

    if (value === undefined || value.trim() === '') {
        throw new Error(
            `Missing required environment variable "${name}". Set it in infra/.env (copy infra/.env.example).`,
        );
    }

    return value;
}
