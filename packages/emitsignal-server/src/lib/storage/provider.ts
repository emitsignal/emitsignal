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
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
export const DENIED_MIME_TYPES = ['image/svg+xml', 'image/svg'] as const;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
    'image/avif': '.avif',
    'image/bmp': '.bmp',
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'text/plain': '.txt',
};

const FALLBACK_EXTENSION = '.bin';

export function extensionForMimeType(mimeType: string): string {
    return EXTENSION_BY_MIME_TYPE[normalizeMimeType(mimeType)] ?? FALLBACK_EXTENSION;
}

export function isAllowedMimeType(mimeType: string): boolean {
    const normalized = normalizeMimeType(mimeType);

    if (DENIED_MIME_TYPES.some((denied) => normalized.startsWith(denied))) {
        return false;
    }

    return ALLOWED_MIME_TYPES.some((prefix) => normalized.startsWith(prefix));
}

function normalizeMimeType(mimeType: string): string {
    return mimeType.split(';')[0].trim().toLowerCase();
}
