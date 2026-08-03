import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, rmSync, unlinkSync } from 'node:fs';
import path from 'node:path';

import { LocalFileStorage } from './local-provider';
import { extensionForMimeType, isAllowedMimeType } from './provider';
import { S3FileStorage } from './s3-provider';

describe('LocalFileStorage', () => {
    const testDir = path.join(import.meta.dir, 'test-uploads');

    it('upload writes file to disk and returns metadata', async () => {
        mkdirSync(testDir, { recursive: true });

        const storage = new LocalFileStorage('http://localhost:5001', testDir);
        const buffer = Buffer.from('hello world');
        const result = await storage.upload({
            buffer,
            filename: 'test.txt',
            mimeType: 'text/plain',
        });

        expect(result.filename).toBe('test.txt');
        expect(result.mimeType).toBe('text/plain');
        expect(result.size).toBe(11);
        expect(result.storageKey).toMatch(/\.txt$/);

        const filePath = path.join(testDir, result.storageKey);
        expect(existsSync(filePath)).toBe(true);

        unlinkSync(filePath);
    });

    it('getUrl returns the correct public URL', async () => {
        const storage = new LocalFileStorage('http://localhost:5001', testDir);
        const url = await storage.getUrl('abc123.png');

        expect(url).toBe('http://localhost:5001/uploads/abc123.png');
    });

    it('getUrl handles custom base URLs', async () => {
        const storage = new LocalFileStorage('https://cdn.example.com', testDir);
        const url = await storage.getUrl('xyz.png');

        expect(url).toBe('https://cdn.example.com/uploads/xyz.png');
    });

    it('delete removes the file from disk', async () => {
        mkdirSync(testDir, { recursive: true });

        const storage = new LocalFileStorage('http://localhost:5001', testDir);
        const filePath = path.join(testDir, 'to-delete.txt');

        Bun.write(filePath, 'delete me');

        await storage.delete('to-delete.txt');

        expect(existsSync(filePath)).toBe(false);
    });

    it('delete does not throw when file is missing', async () => {
        const storage = new LocalFileStorage('http://localhost:5001', testDir);

        await expect(storage.delete('nonexistent-file.txt')).resolves.toBeUndefined();
    });

    it('upload creates the upload directory if absent', async () => {
        const nestedDir = path.join(testDir, 'nested', 'deep');

        try {
            const storage = new LocalFileStorage('http://localhost:5001', nestedDir);
            const buffer = Buffer.from('nested');
            const result = await storage.upload({
                buffer,
                filename: 'nested.txt',
                mimeType: 'text/plain',
            });

            expect(existsSync(path.join(nestedDir, result.storageKey))).toBe(true);
            unlinkSync(path.join(nestedDir, result.storageKey));
        } finally {
            if (existsSync(nestedDir)) {
                rmSync(path.dirname(nestedDir), { force: true, recursive: true });
            }
        }
    });

    // cleanup after all tests
    if (existsSync(testDir)) {
        rmSync(testDir, { force: true, recursive: true });
    }
});

describe('S3FileStorage', () => {
    const writes: Array<{ bucket: string; key: string }> = [];
    const deletes: Array<{ bucket: string; key: string }> = [];

    class FakeS3Client {
        constructor(private readonly config: { bucket: string }) {}

        async delete(key: string): Promise<void> {
            deletes.push({ bucket: this.config.bucket, key });
        }

        presign(key: string): string {
            return `https://s3.example.com/${this.config.bucket}/${key}?signature=abc`;
        }

        async write(key: string): Promise<void> {
            writes.push({ bucket: this.config.bucket, key });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalS3Client = (Bun as any).S3Client;

    beforeAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Bun as any).S3Client = FakeS3Client;
    });

    afterAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Bun as any).S3Client = originalS3Client;
    });

    const baseConfig = {
        accessKeyId: 'key',
        privateBucket: 'private-bucket',
        publicBucket: 'public-bucket',
        secretAccessKey: 'secret',
    };

    it('getUrl on the public bucket returns a stable public URL when publicUrlBase is set', async () => {
        const storage = new S3FileStorage({
            ...baseConfig,
            publicUrlBase: 'https://cdn.example.com',
        });

        const url = await storage.getUrl('avatars/user-123.png', 'public');

        expect(url).toBe('https://cdn.example.com/avatars/user-123.png');
    });

    it('getUrl on the private bucket always presigns (default bucket)', async () => {
        const storage = new S3FileStorage({
            ...baseConfig,
            publicUrlBase: 'https://cdn.example.com',
        });

        const url = await storage.getUrl('attachments/file.png');

        expect(url).toContain('private-bucket');
        expect(url).toContain('signature=');
    });

    it('getUrl on the public bucket falls back to presigning when publicUrlBase is unset', async () => {
        const storage = new S3FileStorage(baseConfig);

        const url = await storage.getUrl('avatars/user-123.png', 'public');

        expect(url).toContain('public-bucket');
        expect(url).toContain('signature=');
    });

    it('upload routes to the public bucket when bucket is public', async () => {
        writes.length = 0;
        const storage = new S3FileStorage(baseConfig);

        await storage.upload({
            bucket: 'public',
            buffer: Buffer.from('img'),
            filename: 'avatar.png',
            mimeType: 'image/png',
            storageKey: 'avatars/user-123.png',
        });

        expect(writes).toEqual([{ bucket: 'public-bucket', key: 'avatars/user-123.png' }]);
    });

    it('upload defaults to the private bucket', async () => {
        writes.length = 0;
        const storage = new S3FileStorage(baseConfig);

        await storage.upload({
            buffer: Buffer.from('file'),
            filename: 'file.txt',
            mimeType: 'text/plain',
            storageKey: 'attachments/file.txt',
        });

        expect(writes).toEqual([{ bucket: 'private-bucket', key: 'attachments/file.txt' }]);
    });

    it('delete targets the requested bucket', async () => {
        deletes.length = 0;
        const storage = new S3FileStorage(baseConfig);

        await storage.delete('avatars/user-123.png', 'public');

        expect(deletes).toEqual([{ bucket: 'public-bucket', key: 'avatars/user-123.png' }]);
    });
});

describe('isAllowedMimeType', () => {
    it('accepts image/png', () => {
        expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('accepts image/jpeg', () => {
        expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('accepts image/gif', () => {
        expect(isAllowedMimeType('image/gif')).toBe(true);
    });

    it('accepts image/webp', () => {
        expect(isAllowedMimeType('image/webp')).toBe(true);
    });

    it('rejects image/svg+xml (SVG can carry inline script → stored XSS)', () => {
        expect(isAllowedMimeType('image/svg+xml')).toBe(false);
    });

    it('rejects image/svg+xml regardless of case/whitespace', () => {
        expect(isAllowedMimeType('  IMAGE/SVG+XML  ')).toBe(false);
    });

    it('accepts text/plain', () => {
        expect(isAllowedMimeType('text/plain')).toBe(true);
    });

    it('rejects application/pdf', () => {
        expect(isAllowedMimeType('application/pdf')).toBe(false);
    });

    it('rejects video/mp4', () => {
        expect(isAllowedMimeType('video/mp4')).toBe(false);
    });

    it('rejects application/json', () => {
        expect(isAllowedMimeType('application/json')).toBe(false);
    });

    it('rejects audio/mpeg', () => {
        expect(isAllowedMimeType('audio/mpeg')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isAllowedMimeType('')).toBe(false);
    });

    it('ignores MIME parameters when matching', () => {
        expect(isAllowedMimeType('text/plain; charset=utf-8')).toBe(true);
        expect(isAllowedMimeType('image/svg+xml; charset=utf-8')).toBe(false);
    });
});

describe('extensionForMimeType', () => {
    it('maps known image types', () => {
        expect(extensionForMimeType('image/png')).toBe('.png');
        expect(extensionForMimeType('image/jpeg')).toBe('.jpg');
        expect(extensionForMimeType('text/plain')).toBe('.txt');
    });

    it('ignores case and MIME parameters', () => {
        expect(extensionForMimeType('IMAGE/PNG')).toBe('.png');
        expect(extensionForMimeType('text/plain; charset=utf-8')).toBe('.txt');
    });

    it('falls back to an inert extension for unmapped types', () => {
        expect(extensionForMimeType('image/svg+xml')).toBe('.bin');
        expect(extensionForMimeType('text/html')).toBe('.bin');
        expect(extensionForMimeType('')).toBe('.bin');
    });
});

describe('storage key derivation (stored-XSS regression)', () => {
    const testDir = path.join(import.meta.dir, 'test-uploads-mime');

    afterAll(() => {
        if (existsSync(testDir)) {
            rmSync(testDir, { force: true, recursive: true });
        }
    });

    it('never derives the extension from the caller-supplied filename', async () => {
        mkdirSync(testDir, { recursive: true });

        const storage = new LocalFileStorage('http://localhost:5001', testDir);
        const result = await storage.upload({
            buffer: Buffer.from('<script>alert(1)</script>'),
            filename: 'payload.html',
            mimeType: 'image/png',
        });

        expect(result.storageKey).not.toContain('.html');
        expect(result.storageKey).toMatch(/\.png$/);

        // The extension is what Bun uses to pick a Content-Type when serving.
        expect(Bun.file(path.join(testDir, result.storageKey)).type).not.toContain('text/html');
    });

    it('does not produce an .svg key for a spoofed svg filename', async () => {
        mkdirSync(testDir, { recursive: true });

        const storage = new LocalFileStorage('http://localhost:5001', testDir);
        const result = await storage.upload({
            buffer: Buffer.from('<svg onload="alert(1)"/>'),
            filename: 'payload.svg',
            mimeType: 'image/png',
        });

        expect(result.storageKey).not.toContain('.svg');
    });
});
