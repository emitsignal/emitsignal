import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { ensureMessageShareId, getSharedMessage } from '#/services/share';

function messageWithTopic(topic: Record<string, unknown>, shareId: null | string = null) {
    return {
        id: 'msg-1',
        shareId,
        topic: { id: 'topic-1', name: 'acme/releases', ownerId: 'owner-1', ...topic },
    };
}

describe('ensureMessageShareId', () => {
    beforeEach(() => {
        prismaMock.topicAccess.findUnique = mock(() => Promise.resolve(null));
        prismaMock.message.update = mock((args?: Record<string, unknown>) =>
            Promise.resolve({ id: 'msg-1', ...((args?.data as object) ?? {}) }),
        );
    });

    it('returns not_found when the message does not exist', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        expect(await ensureMessageShareId('nope', 'user-1')).toEqual({ kind: 'not_found' });
    });

    it('returns not_found — never a 403-shaped result — when the caller cannot read the topic', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'private' })),
        );

        expect(await ensureMessageShareId('msg-1', 'stranger')).toEqual({ kind: 'not_found' });
    });

    it('refuses a private topic the caller owns, reporting the topic back', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'private' })),
        );

        expect(await ensureMessageShareId('msg-1', 'owner-1')).toEqual({
            accessMode: 'private',
            kind: 'topic_not_public',
            topicName: 'acme/releases',
        });
    });

    it('mints a share id for a public topic', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'public' })),
        );

        const result = await ensureMessageShareId('msg-1', 'owner-1');

        expect(result.kind).toBe('ok');
        expect(result).toHaveProperty('shareId');
        expect((result as { shareId: string }).shareId).toMatch(/^[a-z0-9]{8}$/);
        expect(prismaMock.message.update).toHaveBeenCalledTimes(1);
    });

    it('mints a share id for a readonly topic', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'readonly' })),
        );

        expect((await ensureMessageShareId('msg-1', 'owner-1')).kind).toBe('ok');
    });

    it('mints a share id for an unclaimed topic', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'private', ownerId: null })),
        );

        expect((await ensureMessageShareId('msg-1', null)).kind).toBe('ok');
    });

    it('reuses an existing share id instead of minting a second one', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'public' }, 'kx8f2a99')),
        );

        expect(await ensureMessageShareId('msg-1', 'owner-1')).toEqual({
            kind: 'ok',
            shareId: 'kx8f2a99',
        });
        expect(prismaMock.message.update).not.toHaveBeenCalled();
    });

    it('retries with a fresh id when the generated one collides', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'public' })),
        );

        let calls = 0;

        prismaMock.message.update = mock(() => {
            calls += 1;

            if (calls === 1) {
                return Promise.reject(Object.assign(new Error('unique'), { code: 'P2002' }));
            }

            return Promise.resolve({ id: 'msg-1' });
        });

        expect((await ensureMessageShareId('msg-1', 'owner-1')).kind).toBe('ok');
        expect(calls).toBe(2);
    });

    it('propagates a non-collision database error rather than retrying', async () => {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageWithTopic({ accessMode: 'public' })),
        );

        prismaMock.message.update = mock(() => Promise.reject(new Error('connection lost')));

        await expect(ensureMessageShareId('msg-1', 'owner-1')).rejects.toThrow('connection lost');
    });
});

describe('getSharedMessage', () => {
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

    beforeEach(() => {
        prismaMock.topicAccess.findUnique = mock(() => Promise.resolve(null));
        prismaMock.acknowledgment.count = mock(() => Promise.resolve(0));
    });

    it('returns null for an unknown share id', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        expect(await getSharedMessage('deadbeef')).toBeNull();
    });

    it('returns the message, topic and sender for a public topic', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(sharedRow('public')));

        const shared = await getSharedMessage('kx8f2a99');

        expect(shared?.message.title).toBe('Acme API v4.2');
        expect(shared?.message.topicName).toBe('acme/releases');
        expect(shared?.sender).toEqual({ image: null, name: 'maya' });
        expect(shared?.topic).toEqual({
            accessMode: 'public',
            displayName: 'Acme Releases',
            name: 'acme/releases',
            subscriberCount: 1284,
        });
    });

    // The whole revocation story: the share id survives, the access does not.
    it('returns null once the topic flips to private', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(sharedRow('private')));

        expect(await getSharedMessage('kx8f2a99')).toBeNull();
    });
});
