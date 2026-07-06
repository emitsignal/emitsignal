import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { subscribe } from '../../subscriptions/subscribe';

describe('POST /subscriptions', () => {
    const app = new Elysia().use(subscribe);

    function request(body: unknown) {
        return new Request('http://localhost/subscriptions', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    it('creates a subscription', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            createdAt: new Date(),
            description: '',
            displayName: 'Test',
            id: 'id-topic',
            name: 'test-topic-99',
        });

        const res = await app.handle(
            request({ deviceId: 'dev-1', pushEnabled: true, topicName: 'test-topic-99' }),
        );

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({
            id: 'sub-1',
            topic: {
                description: '',
                displayName: 'Test',
                id: 'id-topic',
                name: 'test-topic-99',
            },
        });
    });

    it('pushEnabled defaults to true when omitted', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            createdAt: new Date(),
            description: '',
            displayName: 'Test',
            id: 'topic-1',
            name: 'test-topic',
        });

        await app.handle(request({ deviceId: 'dev-1', topicName: 'test-topic' }));

        const callArgs = prismaMock.subscription.upsert.mock.calls[
            prismaMock.subscription.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { pushEnabled: boolean } }];
        expect(callArgs[0].create.pushEnabled).toBe(true);
    });

    it('respects pushEnabled: false', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            createdAt: new Date(),
            description: '',
            displayName: 'Test',
            id: 'topic-1',
            name: 'test-topic',
        });

        await app.handle(
            request({ deviceId: 'dev-1', pushEnabled: false, topicName: 'test-topic' }),
        );

        const callArgs = prismaMock.subscription.upsert.mock.calls[
            prismaMock.subscription.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { pushEnabled: boolean } }];
        expect(callArgs[0].create.pushEnabled).toBe(false);
    });

    it('returns 422 when missing deviceId', async () => {
        const res = await app.handle(request({ topicName: 'test-topic' }));
        expect(res.status).toBe(422);
    });

    it('returns 422 when missing topicName', async () => {
        const res = await app.handle(request({ deviceId: 'dev-1' }));
        expect(res.status).toBe(422);
    });
});
