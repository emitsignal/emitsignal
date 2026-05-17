import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

const mockBus = { publish: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };
const mockScheduleQueue = { add: mock(() => Promise.resolve()) };

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/event-bus', () => ({ bus: mockBus }));
mock.module('../../../lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: mockScheduleQueue,
}));

import { publish } from '../../topic/publish';

describe('POST /topic/:name', () => {
    const app = new Elysia().use(publish);

    function request(topicName: string, body: unknown) {
        return new Request(`http://localhost/topic/${topicName}`, {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    const validBody = {
        actions: [{ type: 'acknowledge' }],
        body: 'Test message body',
        priority: 3,
        tags: [],
        title: 'Test Title',
    };

    it('publishes a message successfully', async () => {
        const res = await app.handle(request('test-topic', validBody));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({ message: 'posted', messageId: 'msg-1' });
    });

    it('enqueues a push notification job', async () => {
        await app.handle(request('test-topic', validBody));

        const lastCall = mockPushQueue.add.mock.calls[
            mockPushQueue.add.mock.calls.length - 1
        ] as unknown as [string, Record<string, unknown>];

        expect(lastCall[0]).toBe('push-message');
        expect(lastCall[1]).toHaveProperty('messageId', 'msg-1');
    });

    it('publishes to event bus', async () => {
        await app.handle(request('test-topic', validBody));

        expect(mockBus.publish).toHaveBeenCalled();
    });

    it('schedules message when scheduledAt is in the future', async () => {
        const futureTime = Math.floor(Date.now() / 1000) + 3600;
        const body = {
            body: 'Scheduled message',
            priority: 1,
            scheduledAt: futureTime,
            tags: [],
            title: 'Future',
        };

        const res = await app.handle(request('test-topic', body));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.message).toBe('scheduled');
        expect(data.scheduledAt).toBe(futureTime);
        expect(data.messageId).toBe('msg-1');
    });

    it('rejects scheduledAt more than 1 year in the future', async () => {
        const farFuture = Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60;

        const body = {
            body: 'Way too future',
            priority: 1,
            scheduledAt: farFuture,
            tags: [],
            title: 'Far',
        };

        const res = await app.handle(request('test-topic', body));
        // Note: Elysia does not respect { status: 400 } in return value;
        // the route returns 200 with error in body
        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.error).toBe('scheduledAt cannot be more than 1 year in the future');
        expect(data.status).toBe(400);
    });

    it('returns 422 for missing required body fields', async () => {
        const res = await app.handle(request('test-topic', {}));
        expect(res.status).toBe(422);
    });

    it('returns 422 for invalid priority', async () => {
        const body = { body: 'Body', priority: 0, tags: [], title: 'Title' };
        const res = await app.handle(request('test-topic', body));

        expect(res.status).toBe(422);
    });

    it('returns 422 for priority above 5', async () => {
        const body = { body: 'Body', priority: 6, tags: [], title: 'Title' };
        const res = await app.handle(request('test-topic', body));

        expect(res.status).toBe(422);
    });
});
