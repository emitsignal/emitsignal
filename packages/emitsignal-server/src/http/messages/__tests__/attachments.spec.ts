import { describe, expect, it, mock } from 'bun:test';
import Elysia from 'elysia';

import { fileStorageMock, prismaMock } from '../../../__tests__/mocks';
import { duration } from '../../../lib/duration';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/storage', () => ({ FileStorageService: fileStorageMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('../../auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { resetUserPlansForTests, setUserPlanForTests } from '../../../lib/billing/get-user-plan';
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

    it('returns 400 when file exceeds the anonymous (free) 5 MB limit', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const form = new FormData();
        const largeBuffer = new Uint8Array(6 * 1024 * 1024);
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
        expect(data.maxSizeBytes).toBe(5 * 1024 * 1024);
    });

    it('accepts a 6 MB file on the pulse plan', async () => {
        resetUserPlansForTests();
        setUserPlanForTests('pulse-user', 'pulse');
        // authAwareBeforeHandle calls resolveUserId once, then the route handler calls it again
        resolveUserIdMock.mockResolvedValueOnce('pulse-user');
        resolveUserIdMock.mockResolvedValueOnce('pulse-user');
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const form = new FormData();
        const buffer = new Uint8Array(6 * 1024 * 1024);
        const file = new File([buffer], 'medium.txt', { type: 'text/plain' });
        form.append('files', file);

        const res = await app.handle(
            new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            }),
        );

        expect(res.status).toBe(200);
    });

    it('rejects a 26 MB file on the pulse plan but accepts it on beam', async () => {
        resetUserPlansForTests();
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        const buffer = new Uint8Array(26 * 1024 * 1024);

        function uploadRequest() {
            const form = new FormData();
            form.append('files', new File([buffer], 'big.txt', { type: 'text/plain' }));

            return new Request('http://localhost/messages/msg-1/attachments', {
                body: form,
                method: 'POST',
            });
        }

        setUserPlanForTests('plan-user', 'pulse');
        resolveUserIdMock.mockResolvedValueOnce('plan-user');
        resolveUserIdMock.mockResolvedValueOnce('plan-user');

        const rejected = await app.handle(uploadRequest());

        expect(rejected.status).toBe(400);

        setUserPlanForTests('plan-user', 'beam');
        resolveUserIdMock.mockResolvedValueOnce('plan-user');
        resolveUserIdMock.mockResolvedValueOnce('plan-user');

        const accepted = await app.handle(uploadRequest());

        expect(accepted.status).toBe(200);
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

    it('caps attachment expiry at 14 days for authenticated (free-plan) users', async () => {
        // authAwareBeforeHandle calls resolveUserId once, then the route handler calls it again
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

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

        // Free plan retention is 90d, but attachments are capped at 14d.
        const fourteenDaysMs = duration.days(14).as('ms');

        expect(expireTime - now).toBeGreaterThan(fourteenDaysMs - 60000);
        expect(expireTime - now).toBeLessThan(fourteenDaysMs + 60000);
    });

    it('sets 7-day expiry for unauthenticated (anonymous) users', async () => {
        prismaMock.attachment.count = mock(() => Promise.resolve(0));
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({ id: 'msg-1', topicId: 'topic-1' }),
        );

        // Anonymous retention is 7d (below the 14d attachment cap).
        const sevenDaysMs = duration.days(7).as('ms');

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

        expect(expireTime - now).toBeGreaterThan(sevenDaysMs - 60000);
        expect(expireTime - now).toBeLessThan(sevenDaysMs + 60000);
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
