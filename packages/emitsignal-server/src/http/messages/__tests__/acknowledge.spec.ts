import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

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

    it('acknowledges a message and returns count', async () => {
        const res = await app.handle(request('msg-1', { deviceId: 'dev-1' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ acknowledged: true, count: 0 });
    });

    it('includes userId when provided', async () => {
        await app.handle(request('msg-2', { deviceId: 'dev-1', userId: 'user-1' }));

        const callArgs = prismaMock.acknowledgment.upsert.mock.calls[
            prismaMock.acknowledgment.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { userId: null | string } }];

        expect(callArgs[0].create.userId).toBe('user-1');
    });

    it('userId is null when omitted', async () => {
        await app.handle(request('msg-3', { deviceId: 'dev-1' }));

        const callArgs = prismaMock.acknowledgment.upsert.mock.calls[
            prismaMock.acknowledgment.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { userId: null | string } }];

        expect(callArgs[0].create.userId).toBeNull();
    });

    it('returns 422 when missing deviceId', async () => {
        const res = await app.handle(request('msg-4', {}));

        expect(res.status).toBe(422);
    });
});
