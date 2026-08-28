import { beforeEach, describe, expect, it, mock } from 'bun:test';
import Elysia from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { getShare } from '#/http/share/get';

const sharedRow = (accessMode: string) => ({
    actions: '[]',
    body: 'webhooks 3x faster',
    createdAt: new Date(1700000000000),
    id: 'msg-1',
    priority: 3,
    sender: { image: null, name: 'maya' },
    tags: ['release'],
    title: 'Acme API v4.2',
    topic: {
        _count: { subscriptions: 1284 },
        accessMode,
        displayName: 'Acme Releases',
        id: 'topic-1',
        name: 'acme/releases',
        ownerId: 'owner-1',
    },
    topicId: 'topic-1',
});

describe('GET /share/:shareId', () => {
    const app = new Elysia().use(getShare);

    beforeEach(() => {
        prismaMock.topicAccess.findUnique = mock(() => Promise.resolve(null));
        prismaMock.acknowledgment.count = mock(() => Promise.resolve(0));
    });

    it('serves a public-topic message to a caller with no credentials at all', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(sharedRow('public')));

        const res = await app.handle(new Request('http://localhost/share/kx8f2a99'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.message.title).toBe('Acme API v4.2');
        expect(data.topic.subscriberCount).toBe(1284);
        expect(data.sender.name).toBe('maya');
    });

    it('404s once the topic flips to private, so the link is revoked', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(sharedRow('private')));

        const res = await app.handle(new Request('http://localhost/share/kx8f2a99'));

        expect(res.status).toBe(404);
        expect((await res.json()).error).toBe('share_not_found');
    });

    it('404s an unknown share id', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        const res = await app.handle(new Request('http://localhost/share/deadbeef'));

        expect(res.status).toBe(404);
    });

    // Rejecting the shape before the query keeps enumeration cheap to refuse.
    it('404s a malformed share id without touching the database', async () => {
        const findUnique = mock(() => Promise.resolve(null));

        prismaMock.message.findUnique = findUnique;

        const res = await app.handle(new Request('http://localhost/share/NOT-A-SHARE-ID'));

        expect(res.status).toBe(404);
        expect(findUnique).not.toHaveBeenCalled();
    });
});
