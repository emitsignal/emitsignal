export interface FileMetadata {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
}

export interface FileStorage {
    delete(storageKey: string): Promise<void>;
    getUrl(storageKey: string): Promise<string>;
    upload(input: FileUploadInput): Promise<FileMetadata>;
}

export interface FileUploadInput {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    storageKey?: string;
}

export const ALLOWED_MIME_TYPES = ['image/', 'text/plain'] as const;
export const ATTACHMENT_MAX_SIZE = 25 * 1024 * 1024; // 25 MB
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.some((prefix) => mimeType.startsWith(prefix));
}
