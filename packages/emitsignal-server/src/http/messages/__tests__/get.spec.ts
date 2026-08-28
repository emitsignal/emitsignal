import { describe, expect, it, mock } from 'bun:test';
import Elysia from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { getMessage } from '#/http/messages/get';

describe('GET /messages/:id', () => {
    const app = new Elysia().use(getMessage);

    it('returns 404 when message does not exist', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        const res = await app.handle(new Request('http://localhost/messages/msg-1'));

        expect(res.status).toBe(404);

        const data = await res.json();

        expect(data.error).toBe('message_not_found');
    });

    it('returns 404 for a private-topic message when the caller is not a member', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({
                actions: '[]',
                body: 'secret',
                createdAt: new Date(1700000000000),
                id: 'msg-private',
                priority: 3,
                tags: '[]',
                title: 'Secret',
                topic: {
                    accessMode: 'private',
                    id: 'topic-private',
                    name: 'secret-topic',
                    ownerId: 'owner-1',
                },
                topicId: 'topic-private',
            }),
        );
        // Anonymous caller (no session), and no TopicAccess row exists.
        resolveUserIdMock.mockResolvedValueOnce(null);

        prismaMock.topicAccess.findUnique = mock(() => Promise.resolve(null));

        const res = await app.handle(new Request('http://localhost/messages/msg-private'));

        expect(res.status).toBe(404);
    });

    it('returns a single message with attachments and topicName', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({
                actions: '[]',
                body: 'Hello world',
                createdAt: new Date(1700000000000),
                id: 'msg-1',
                priority: 3,
                tags: '["alert"]',
                title: 'Test',
                topic: { name: 'alerts/prod' },
                topicId: 'topic-1',
            }),
        );

        prismaMock.acknowledgment.count = mock(() => Promise.resolve(5));

        const res = await app.handle(new Request('http://localhost/messages/msg-1'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.id).toBe('msg-1');
        expect(data.body).toBe('Hello world');
        expect(data.topicName).toBe('alerts/prod');
        expect(data.attachments).toEqual([]);
        expect(data.acknowledgmentCount).toBe(5);
    });

    it('resolves attachment URLs when includeAttachments is true', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({
                actions: '[]',
                body: 'With file',
                createdAt: new Date(1700000000000),
                id: 'msg-2',
                priority: 1,
                tags: '[]',
                title: 'File',
                topic: { name: 'files' },
                topicId: 't2',
            }),
        );

        prismaMock.acknowledgment.count = mock(() => Promise.resolve(0));

        prismaMock.attachment.findMany.mockResolvedValueOnce([
            { filename: 'photo.png', mimeType: 'image/png', size: 2048, storageKey: 'key1.png' },
        ]);

        fileStorageMock.provider.getUrl.mockResolvedValueOnce('https://cdn.example.com/key1.png');

        const res = await app.handle(new Request('http://localhost/messages/msg-2'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.attachments).toEqual([
            {
                filename: 'photo.png',
                mimeType: 'image/png',
                size: 2048,
                storageKey: 'key1.png',
                url: 'https://cdn.example.com/key1.png',
            },
        ]);
    });
});
