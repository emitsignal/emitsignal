export interface FileMetadata {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
}

export interface FileStorage {
    delete(storageKey: string, bucket?: StorageBucket): Promise<void>;
    getUrl(storageKey: string, bucket?: StorageBucket): Promise<string>;
    upload(input: FileUploadInput): Promise<FileMetadata>;
}

export interface FileUploadInput {
    bucket?: StorageBucket;
    buffer: Buffer;
    filename: string;
    mimeType: string;
    storageKey?: string;
}

export type StorageBucket = 'private' | 'public';

export const ALLOWED_MIME_TYPES = ['image/', 'text/plain'] as const;
// Attachment size limits are plan-based — see src/lib/billing/plans.ts
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.some((prefix) => mimeType.startsWith(prefix));
}
