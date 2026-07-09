import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('../../auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { acknowledge } from '../../messages/acknowledge';

describe('POST /messages/:id/acknowledge', () => {
    const app = new Elysia().use(acknowledge);

    function request(messageId: string, body: unknown) {
        return new Request(`http://localhost/messages/${messageId}/acknowledge`, {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    // A readable (ownerless → public) message the ack can attach to.
    function mockReadableMessage() {
        prismaMock.message.findUnique = mock(() =>
            Promise.resolve({
                topic: { accessMode: 'public', id: 'topic-1', ownerId: null },
            }),
        );
    }

    it('acknowledges a message and returns count', async () => {
        mockReadableMessage();

        resolveUserIdMock.mockResolvedValueOnce(null);

        const res = await app.handle(request('msg-1', { deviceId: 'dev-1' }));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({ acknowledged: true, count: 0 });
    });

    it('attributes the ack to the authenticated session user, not the body', async () => {
        mockReadableMessage();

        resolveUserIdMock.mockResolvedValueOnce('user-1');

        // A forged userId in the body must be ignored.
        await app.handle(request('msg-2', { deviceId: 'dev-1', userId: 'attacker' }));

        const callArgs = prismaMock.acknowledgment.upsert.mock.calls[
            prismaMock.acknowledgment.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { userId: null | string } }];

        expect(callArgs[0].create.userId).toBe('user-1');
    });

    it('userId is null for anonymous callers', async () => {
        mockReadableMessage();

        resolveUserIdMock.mockResolvedValueOnce(null);

        await app.handle(request('msg-3', { deviceId: 'dev-1' }));

        const callArgs = prismaMock.acknowledgment.upsert.mock.calls[
            prismaMock.acknowledgment.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { userId: null | string } }];

        expect(callArgs[0].create.userId).toBeNull();
    });

    it('returns 404 when the message does not exist', async () => {
        prismaMock.message.findUnique = mock(() => Promise.resolve(null));

        const res = await app.handle(request('missing', { deviceId: 'dev-1' }));

        expect(res.status).toBe(404);
    });

    it('returns 422 when missing deviceId', async () => {
        mockReadableMessage();

        const res = await app.handle(request('msg-4', {}));

        expect(res.status).toBe(422);
    });
});
