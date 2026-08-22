import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

const mockBus = { publish: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };
const mockScheduleQueue = { add: mock(() => Promise.resolve()) };

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/event-bus', () => ({ bus: mockBus }));
mock.module('#/lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: mockScheduleQueue,
}));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { publish } from '#/http/topic/publish';
import { readMessageTotal, resetMessageCounterForTests } from '#/services/stats/message-counter';

describe('POST /publish/:name', () => {
    const app = new Elysia().use(publish);

    function request(topicName: string, body: unknown) {
        return new Request(`http://localhost/publish/${topicName}`, {
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

    it('counts the message against the lifetime total', async () => {
        resetMessageCounterForTests();

        await app.handle(request('test-topic', validBody));
        await app.handle(request('test-topic', validBody));

        expect(await readMessageTotal()).toBe(2);
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

    it('returns 400 for a fully empty body (missing title and body)', async () => {
        const res = await app.handle(request('test-topic', {}));

        expect(res.status).toBe(400);

        const data = await res.json();

        expect(data.error).toBe('missing_content');
    });

    it('returns 400 when both title and body are absent', async () => {
        const res = await app.handle(request('test-topic', { priority: 3, tags: [] }));

        expect(res.status).toBe(400);

        const data = await res.json();

        expect(data.error).toBe('missing_content');
    });

    it('returns 400 when title and body are whitespace only', async () => {
        const res = await app.handle(
            request('test-topic', { body: '  ', priority: 3, tags: [], title: '   ' }),
        );

        expect(res.status).toBe(400);

        const data = await res.json();

        expect(data.error).toBe('missing_content');
    });

    it('publishes with title only (no body)', async () => {
        const res = await app.handle(
            request('test-topic', { priority: 3, tags: [], title: 'Only title' }),
        );

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.message).toBe('posted');
    });

    it('publishes with body only (no title)', async () => {
        const res = await app.handle(
            request('test-topic', { body: 'Only body', priority: 3, tags: [] }),
        );

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.message).toBe('posted');
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

    describe('header-based publishing (ntfy-compatible)', () => {
        function headerRequest(
            topicName: string,
            body: string,
            headers: Record<string, string> = {},
        ) {
            return new Request(`http://localhost/publish/${topicName}`, {
                body,
                headers: { 'Content-Type': 'text/plain', ...headers },
                method: 'POST',
            });
        }

        it('returns 400 when body is empty and no title header is present', async () => {
            const res = await app.handle(headerRequest('test-topic', ''));

            expect(res.status).toBe(400);

            const data = await res.json();

            expect(data.error).toBe('missing_content');
        });

        it('publishes with plain-text body and X-Title header', async () => {
            const res = await app.handle(
                headerRequest('test-topic', 'Hello from header mode', { 'X-Title': 'Alert' }),
            );

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data).toEqual({ message: 'posted', messageId: 'msg-1' });
        });

        it('uses default priority 3 when X-Priority is absent', async () => {
            const res = await app.handle(headerRequest('test-topic', 'No priority header'));

            expect(res.status).toBe(200);
        });

        it('maps priority names to integers', async () => {
            const priorities = ['urgent', 'high', 'default', 'low', 'min'];

            for (const priority of priorities) {
                const res = await app.handle(
                    headerRequest('test-topic', 'body', { 'X-Priority': priority }),
                );

                expect(res.status).toBe(200);
            }
        });

        it('parses comma-separated tags from X-Tags header', async () => {
            const res = await app.handle(
                headerRequest('test-topic', 'tagged', { 'X-Tags': 'deploy, prod, v2' }),
            );

            expect(res.status).toBe(200);
        });

        it('schedules message when X-Delay duration is provided', async () => {
            const res = await app.handle(
                headerRequest('test-topic', 'delayed', { 'X-Delay': '1h', 'X-Title': 'Later' }),
            );

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.message).toBe('scheduled');
        });

        it('accepts short header aliases (t, p, ta)', async () => {
            const res = await app.handle(
                headerRequest('test-topic', 'Short alias test', { p: '4', t: 'Short', ta: 'a,b' }),
            );

            expect(res.status).toBe(200);
        });

        it('uses X-Message header as body override', async () => {
            const res = await app.handle(
                headerRequest('test-topic', 'raw body ignored', {
                    'X-Message': 'overridden body',
                    'X-Title': 'Override',
                }),
            );

            expect(res.status).toBe(200);
        });

        it('accepts JSON actions via X-Actions header', async () => {
            const actions = JSON.stringify([{ type: 'acknowledge' }]);
            const res = await app.handle(
                headerRequest('test-topic', 'with action', { 'X-Actions': actions }),
            );

            expect(res.status).toBe(200);
        });
    });
});

describe('publish routing', () => {
    const app = new Elysia().use(publish);

    function request(path: string) {
        return new Request(`http://localhost${path}`, {
            body: JSON.stringify({ body: 'Test message body', priority: 3, title: 'Test Title' }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    it('accepts a topic name containing slashes without encoding', async () => {
        const res = await app.handle(request('/publish/ci/web'));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ message: 'posted', messageId: 'msg-1' });
    });

    it('still accepts a percent-encoded slash', async () => {
        const res = await app.handle(request('/publish/ci%2Fweb'));

        expect(res.status).toBe(200);
    });

    it('rejects a malformed percent-encoded topic name', async () => {
        const res = await app.handle(request('/publish/ci%2'));

        expect(res.status).toBe(400);
    });

    it('rejects a publish with no topic name', async () => {
        const res = await app.handle(request('/publish/'));

        expect(res.status).toBe(400);
    });

    it('does not mark the canonical path deprecated', async () => {
        const res = await app.handle(request('/publish/test-topic'));

        expect(res.headers.get('deprecation')).toBeNull();
        expect(res.headers.get('link')).toBeNull();
    });

    it('still serves the legacy /topic path, including slashes', async () => {
        const res = await app.handle(request('/topic/ci/web'));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ message: 'posted', messageId: 'msg-1' });
    });

    it('announces the deprecation on the legacy /topic path', async () => {
        const res = await app.handle(request('/topic/test-topic'));

        expect(res.headers.get('deprecation')).toBe('@1786320000');
        expect(res.headers.get('link')).toBe('</publish/*>; rel="successor-version"');
    });
});
