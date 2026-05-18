import { describe, expect, it, mock } from 'bun:test';
import Elysia from 'elysia';

import { fileStorageMock, prismaMock } from '../../../__tests__/mocks';
import { signToken } from '../../../lib/jwt';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { attachments } from '../attachments';

describe('POST /messages/:id/attachments', () => {
    const app = new Elysia().use(attachments);

    it('returns 422 when no files are attached (Elysia schema validation)', async () => {
        const form = new FormData();
        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(422);
    });

    it('returns 404 when message does not exist', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        const form = new FormData();
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toBe('message_not_found');
    });

    it('returns 400 when file exceeds 25 MB limit', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const form = new FormData();
        const largeBuffer = new Uint8Array(26 * 1024 * 1024);
        const file = new File([largeBuffer], 'large.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('file_too_large');
    });

    it('returns 409 when message already has an attachment', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );
        prismaMock.attachment.count = mock(() => Promise.resolve(1));

        const form = new FormData();
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toBe('attachment_already_exists');
    });

    it('returns 400 when more than one file is attached', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const form = new FormData();
        const file1 = new File(['a'], 'a.txt', { type: 'text/plain' });
        const file2 = new File(['b'], 'b.txt', { type: 'text/plain' });
        form.append('files', file1);
        form.append('files', file2);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('too_many_files');
    });

    it('returns 400 for invalid MIME type', async () => {
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const form = new FormData();
        const file = new File(['pdf content'], 'doc.pdf', { type: 'application/pdf' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('invalid_mime_type');
    });

    it('sets 15-day expiry for authenticated users', async () => {
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createFn = mock((args: any) =>
            Promise.resolve({
                createdAt: new Date(),
                expiresAt: args.data.expiresAt,
                filename: args.data.filename,
                id: 'att-1',
                mimeType: args.data.mimeType,
                size: args.data.size,
                storageKey: args.data.storageKey,
            }),
        );
        prismaMock.attachment.create = createFn;

        const token = await signToken('user-1');

        const form = new FormData();
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                headers: { authorization: `Bearer ${token}` },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(200);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createCall = createFn.mock.calls[0] as [any];
        const expireTime = createCall[0].data.expiresAt.getTime();
        const now = Date.now();

        expect(expireTime - now).toBeGreaterThan(fifteenDaysMs - 60000);
        expect(expireTime - now).toBeLessThan(fifteenDaysMs + 60000);
    });

    it('sets 3-hour expiry for unauthenticated users', async () => {
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const threeHoursMs = 3 * 60 * 60 * 1000;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createFn = mock((args: any) =>
            Promise.resolve({
                createdAt: new Date(),
                expiresAt: args.data.expiresAt,
                filename: args.data.filename,
                id: 'att-1',
                mimeType: args.data.mimeType,
                size: args.data.size,
                storageKey: args.data.storageKey,
            }),
        );
        prismaMock.attachment.create = createFn;

        const form = new FormData();
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(200);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createCall = createFn.mock.calls[0] as [any];
        const expireTime = createCall[0].data.expiresAt.getTime();
        const now = Date.now();

        expect(expireTime - now).toBeGreaterThan(threeHoursMs - 60000);
        expect(expireTime - now).toBeLessThan(threeHoursMs + 60000);
    });

    it('returns 422 for non-multipart requests (Elysia schema validation)', async () => {
        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: JSON.stringify({ text: 'not a file' }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(422);
    });

    it('uploads a single file and returns attachment record', async () => {
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uploadMock = mock((input: any) =>
            Promise.resolve({
                filename: input.filename,
                mimeType: input.mimeType,
                size: input.buffer.byteLength,
                storageKey: `${crypto.randomUUID()}.txt`,
            }),
        );
        fileStorageMock.provider.upload = uploadMock;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createFn = mock((args: any) =>
            Promise.resolve({
                createdAt: new Date(),
                expiresAt: args.data.expiresAt,
                filename: args.data.filename,
                id: `att-${args.data.storageKey}`,
                mimeType: args.data.mimeType,
                size: args.data.size,
                storageKey: args.data.storageKey,
            }),
        );
        prismaMock.attachment.create = createFn;

        const form = new FormData();
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.attachments).toHaveLength(1);
        expect(data.attachments[0].filename).toBe('hello.txt');
    });
});
