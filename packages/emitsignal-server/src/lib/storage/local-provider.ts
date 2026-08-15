import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '#/lib/logger';

import type { FileMetadata, FileStorage, FileUploadInput } from './provider';

import { extensionForMimeType } from './provider';

export class LocalFileStorage implements FileStorage {
    constructor(
        private readonly baseUrl: string,
        private readonly uploadDir: string,
    ) {}

    async delete(storageKey: string): Promise<void> {
        const filePath = path.join(this.uploadDir, storageKey);

        await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') {
                return;
            }

            logger.warn({ error, storageKey }, 'local file delete failed');
        });
    }

    async getUrl(storageKey: string): Promise<string> {
        return `${this.baseUrl}/uploads/${storageKey}`;
    }

    async upload(input: FileUploadInput): Promise<FileMetadata> {
        const ext = extensionForMimeType(input.mimeType);
        const storageKey = input.storageKey ?? `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(this.uploadDir, storageKey);

        await mkdir(path.dirname(filePath), { recursive: true });

        await writeFile(filePath, input.buffer);

        return {
            filename: input.filename,
            mimeType: input.mimeType,
            size: input.buffer.byteLength,
            storageKey,
        };
    }
}
