import type { FileMetadata, FileStorage, FileUploadInput, StorageBucket } from './provider';

import { duration } from '../duration';

interface S3Client {
    delete(key: string): Promise<void>;
    presign(key: string, options: { expiresIn: number; method: string; type: string }): string;
    write(key: string, body: Buffer, options?: { type?: string }): Promise<void>;
}

interface S3ClientConfig {
    accessKeyId: string;
    bucket: string;
    endpoint?: string;
    region?: string;
    secretAccessKey: string;
}

interface S3Config {
    accessKeyId: string;
    endpoint?: string;
    privateBucket: string;
    publicBucket: string;
    publicUrlBase?: string;
    region?: string;
    secretAccessKey: string;
}

export class S3FileStorage implements FileStorage {
    private readonly privateClient: S3Client;
    private readonly publicClient: S3Client;
    private readonly publicUrlBase: null | string;

    constructor(config: S3Config) {
        const credentials: Omit<S3ClientConfig, 'bucket'> = {
            accessKeyId: config.accessKeyId,
            endpoint: config.endpoint,
            region: config.region,
            secretAccessKey: config.secretAccessKey,
        };

        this.privateClient = this.createClient({ ...credentials, bucket: config.privateBucket });
        this.publicClient = this.createClient({ ...credentials, bucket: config.publicBucket });
        this.publicUrlBase = config.publicUrlBase ?? null;
    }

    async delete(storageKey: string, bucket: StorageBucket = 'private'): Promise<void> {
        await this.clientFor(bucket)
            .delete(storageKey)
            .catch(() => {
                // object may already be gone — that's fine
            });
    }

    async getUrl(storageKey: string, bucket: StorageBucket = 'private'): Promise<string> {
        if (bucket === 'public' && this.publicUrlBase) {
            return `${this.publicUrlBase}/${storageKey}`;
        }

        return this.clientFor(bucket).presign(storageKey, {
            expiresIn: duration.hours(1).as('seconds'),
            method: 'GET',
            type: 'application/octet-stream',
        });
    }

    async upload(input: FileUploadInput): Promise<FileMetadata> {
        const ext = input.filename.split('.').pop() ?? '';
        const storageKey = input.storageKey ?? `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

        await this.clientFor(input.bucket ?? 'private').write(storageKey, input.buffer, {
            type: input.mimeType,
        });

        return {
            filename: input.filename,
            mimeType: input.mimeType,
            size: input.buffer.byteLength,
            storageKey,
        };
    }

    private clientFor(bucket: StorageBucket): S3Client {
        return bucket === 'public' ? this.publicClient : this.privateClient;
    }

    private createClient(config: S3ClientConfig): S3Client {
        return new Bun.S3Client({
            accessKeyId: config.accessKeyId,
            bucket: config.bucket,
            endpoint: config.endpoint,
            region: config.region,
            secretAccessKey: config.secretAccessKey,
        }) as unknown as S3Client;
    }
}
