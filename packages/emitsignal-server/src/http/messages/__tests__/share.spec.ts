import { beforeEach, describe, expect, it, mock } from 'bun:test';
import Elysia from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { shareMessage } from '#/http/messages/share';

const post = (id: string) =>
    new Request(`http://localhost/messages/${id}/share`, { method: 'POST' });

function messageInTopic(accessMode: string, shareId: null | string = null) {
    return {
        id: 'msg-1',
        shareId,
        topic: { accessMode, id: 'topic-1', name: 'acme/releases', ownerId: 'owner-1' },
    };
}

describe('POST /messages/:id/share', () => {
    const app = new Elysia().use(shareMessage);

    beforeEach(() => {
        prismaMock.topicAccess.findUnique = mock(() => Promise.resolve(null));
        prismaMock.message.update = mock(() => Promise.resolve({ id: 'msg-1' }));
    });

    it('returns 401 for an anonymous caller', async () => {
        resolveUserIdMock.mockResolvedValueOnce(null);

        const res = await app.handle(post('msg-1'));

        expect(res.status).toBe(401);
        expect((await res.json()).error).toBe('missing_token');
    });

    it('returns 404 when the message does not exist', async () => {
        resolveUserIdMock.mockResolvedValueOnce('owner-1');
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        const res = await app.handle(post('nope'));

        expect(res.status).toBe(404);
        expect((await res.json()).error).toBe('message_not_found');
    });

    it('returns 404, not 403, when the caller cannot read the topic', async () => {
        resolveUserIdMock.mockResolvedValueOnce('stranger');
        prismaMock.message.findUnique = mock(() => Promise.resolve(messageInTopic('private')));

        const res = await app.handle(post('msg-1'));

        expect(res.status).toBe(404);
    });

    it('returns 409 with the topic details when the topic is private', async () => {
        resolveUserIdMock.mockResolvedValueOnce('owner-1');
        prismaMock.message.findUnique = mock(() => Promise.resolve(messageInTopic('private')));

        const res = await app.handle(post('msg-1'));

        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({
            accessMode: 'private',
            error: 'topic_not_public',
            topicName: 'acme/releases',
        });
    });

    it('returns a share id for a public topic', async () => {
        resolveUserIdMock.mockResolvedValueOnce('owner-1');
        prismaMock.message.findUnique = mock(() => Promise.resolve(messageInTopic('public')));

        const res = await app.handle(post('msg-1'));

        expect(res.status).toBe(200);
        expect((await res.json()).shareId).toMatch(/^[a-z0-9]{8}$/);
    });

    it('returns the same share id on a repeat call', async () => {
        resolveUserIdMock.mockResolvedValue('owner-1');
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve(messageInTopic('public', 'kx8f2a99')),
        );

        const first = await app.handle(post('msg-1'));
        const second = await app.handle(post('msg-1'));

        expect((await first.json()).shareId).toBe('kx8f2a99');
        expect((await second.json()).shareId).toBe('kx8f2a99');
        expect(prismaMock.message.update).not.toHaveBeenCalled();
    });
});
