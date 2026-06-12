import { describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, rmSync, unlinkSync } from 'node:fs';
import path from 'node:path';

import { LocalFileStorage } from '../storage/local-provider';
import { isAllowedMimeType } from '../storage/provider';

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

    it('accepts image/svg+xml', () => {
        expect(isAllowedMimeType('image/svg+xml')).toBe(true);
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
});
