import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { unsubscribe } from '../../subscriptions/unsubscribe';

describe('DELETE /subscriptions', () => {
    const app = new Elysia().use(unsubscribe);

    function request(body: unknown) {
        return new Request('http://localhost/subscriptions', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'DELETE',
        });
    }

    it('deletes the subscription and returns ok', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({ id: 't1', name: 'test-topic' });

        const res = await app.handle(request({ deviceId: 'dev-1', topicName: 'test-topic' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ ok: true });
    });

    it('returns ok even when topic is not found', async () => {
        const res = await app.handle(request({ deviceId: 'dev-1', topicName: 'nonexistent' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ ok: true });
    });

    it('returns ok when delete throws (subscription not found)', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({ id: 't1', name: 'test-topic' });
        prismaMock.subscription.delete.mockRejectedValueOnce(new Error('not found'));

        const res = await app.handle(request({ deviceId: 'dev-1', topicName: 'test-topic' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ ok: true });
    });

    it('returns 422 when missing body fields', async () => {
        const res = await app.handle(request({ topicName: 'test-topic' }));
        expect(res.status).toBe(422);
    });
});
