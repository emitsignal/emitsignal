import type { FileMetadata, FileStorage, FileUploadInput } from './provider';

interface S3Client {
    delete(key: string): Promise<void>;
    presign(key: string, options: { expiresIn: number; method: string; type: string }): string;
    write(key: string, body: Buffer, options?: { type?: string }): Promise<void>;
}

interface S3Config {
    accessKeyId: string;
    bucket: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    publicUrlBase?: string;
    region?: string;
    secretAccessKey: string;
}

export class S3FileStorage implements FileStorage {
    private readonly publicUrlBase: null | string;
    private readonly s3: S3Client;

    constructor(config: S3Config) {
        this.s3 = new Bun.S3Client({
            accessKeyId: config.accessKeyId,
            bucket: config.bucket,
            endpoint: config.endpoint,
            region: config.region,
            secretAccessKey: config.secretAccessKey,
        }) as unknown as S3Client;
        this.publicUrlBase = config.publicUrlBase ?? null;
    }

    async delete(storageKey: string): Promise<void> {
        await this.s3.delete(storageKey).catch(() => {
            // object may already be gone — that's fine
        });
    }

    async getUrl(storageKey: string): Promise<string> {
        if (this.publicUrlBase) {
            return `${this.publicUrlBase}/${storageKey}`;
        }

        return this.s3.presign(storageKey, {
            expiresIn: 3600,
            method: 'GET',
            type: 'application/octet-stream',
        });
    }

    async upload(input: FileUploadInput): Promise<FileMetadata> {
        const ext = input.filename.split('.').pop() ?? '';
        const storageKey = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

        await this.s3.write(storageKey, input.buffer, { type: input.mimeType });

        return {
            filename: input.filename,
            mimeType: input.mimeType,
            size: input.buffer.byteLength,
            storageKey,
        };
    }
}
