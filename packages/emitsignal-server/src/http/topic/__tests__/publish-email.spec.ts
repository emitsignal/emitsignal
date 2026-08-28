import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';
import { topicNameCache } from '#/lib/cache';

const mockBus = { publish: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };
const mockScheduleQueue = { add: mock(() => Promise.resolve()) };
const mockSend = mock<(options: { subject: string; to: string }) => Promise<void>>(() =>
    Promise.resolve(),
);

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/event-bus', () => ({ bus: mockBus }));
mock.module('#/lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: mockScheduleQueue,
}));
mock.module('#/lib/email-service', () => ({ EmailService: { send: mockSend } }));
mock.module('#/http/auth/resolve-user-id', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { publish } from '#/http/topic/publish';
import { resetUserPlansForTests, setUserPlanForTests } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { getDailyUsage, resetUsageForTests } from '#/services/billing/usage';

const SENDER_EMAIL = 'owner@example.com';

const TOPIC = {
    accessMode: 'public',
    createdAt: new Date(1700000000000),
    description: '',
    displayName: 'alerts',
    id: 'topic-alerts',
    name: 'alerts',
    ownerId: null,
};

describe('POST /publish/<topic> — email notifications', () => {
    const app = new Elysia().use(publish);

    function jsonRequest(payload: Record<string, unknown>, userId?: string) {
        return new Request('http://localhost/publish/alerts', {
            body: JSON.stringify({ body: 'Disk almost full', priority: 3, ...payload }),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    function headerRequest(headers: Record<string, string>, userId?: string) {
        return new Request('http://localhost/publish/alerts', {
            body: 'Disk almost full',
            headers: { ...headers, ...(userId ? { 'x-test-user-id': userId } : {}) },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUsageForTests();
        resetUserPlansForTests();
        mockSend.mockClear();
        // prismaMock is a module singleton shared by every spec in the process, so an
        // earlier file can leave a topic row behind and getOrCreateTopic would resolve
        // a name this file never chose. Seeding the cache keeps the topic ours no
        // matter what the shared mock currently returns.
        topicNameCache.clear();
        topicNameCache.set(TOPIC.name, TOPIC as never);
        // The shared mock returns `tags` as a JSON string; the real column is String[],
        // and the alert template maps over it.
        prismaMock.message.create = mock(() =>
            Promise.resolve({
                actions: '[]',
                body: 'Disk almost full',
                createdAt: new Date(),
                id: 'msg-1',
                priority: 3,
                scheduledAt: null,
                tags: [],
                title: '',
                topicId: 'topic-1',
            }),
        ) as typeof prismaMock.message.create;
        prismaMock.user.findUnique = mock(() =>
            Promise.resolve({ email: SENDER_EMAIL, emailVerified: true }),
        ) as typeof prismaMock.user.findUnique;
    });

    it('rejects anonymous senders without creating the message', async () => {
        const res = await app.handle(headerRequest({ Email: 'you@example.com' }));

        expect(res.status).toBe(403);
        expect(await res.json()).toMatchObject({ error: 'anonymous_email_forbidden' });
        expect(prismaMock.message.create).not.toHaveBeenCalled();
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('rejects email combined with a delay', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(
            headerRequest({ Email: 'yes', 'X-Delay': '1h' }, 'email-user'),
        );

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ error: 'email_not_schedulable' });
        expect(prismaMock.message.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed address', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(headerRequest({ Email: 'nope' }, 'email-user'));

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ error: 'invalid_email' });
    });

    it('rejects more than one address', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(
            headerRequest({ Email: 'a@example.com,b@example.com' }, 'email-user'),
        );

        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({
            error: 'invalid_email',
            message: 'only one email address is supported',
        });
    });

    it('lets a free user email their own verified address via the self token', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));

        expect(res.status).toBe(200);
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend.mock.calls[0][0]).toMatchObject({
            subject: `[${TOPIC.name}] Disk almost full`,
            to: SENDER_EMAIL,
        });
    });

    it('refuses an unverified account address', async () => {
        setUserPlanForTests('email-user', 'free');

        prismaMock.user.findUnique = mock(() =>
            Promise.resolve({ email: SENDER_EMAIL, emailVerified: false }),
        ) as typeof prismaMock.user.findUnique;

        const res = await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));

        expect(res.status).toBe(403);
        expect(await res.json()).toMatchObject({ error: 'email_not_verified' });
    });

    it('requires a paid plan to email a third-party address', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(headerRequest({ Email: 'you@example.com' }, 'email-user'));

        expect(res.status).toBe(403);
        expect(await res.json()).toMatchObject({
            error: 'plan_required',
            requiredPlans: ['pulse', 'beam'],
        });
        expect(prismaMock.message.create).not.toHaveBeenCalled();
    });

    it('allows a paid plan to email a third-party address', async () => {
        setUserPlanForTests('paid-user', 'pulse');

        const res = await app.handle(headerRequest({ Email: 'you@example.com' }, 'paid-user'));

        expect(res.status).toBe(200);
        expect(mockSend.mock.calls[0][0]).toMatchObject({ to: 'you@example.com' });
    });

    it('accepts the address through the JSON body', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(jsonRequest({ email: SENDER_EMAIL }, 'email-user'));

        expect(res.status).toBe(200);
        expect(mockSend.mock.calls[0][0]).toMatchObject({ to: SENDER_EMAIL });
    });

    // Six aliases against the free tier's five-a-day would trip the quota, so this
    // uses a paid plan to keep the assertion about aliases only.
    it('accepts every ntfy header alias', async () => {
        setUserPlanForTests('paid-user', 'pulse');

        for (const alias of ['X-Email', 'X-E-mail', 'Email', 'E-mail', 'Mail', 'e']) {
            mockSend.mockClear();

            const res = await app.handle(headerRequest({ [alias]: 'yes' }, 'paid-user'));

            expect(res.status).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(1);
        }
    });

    it('returns 429 with quota headers once the daily email limit is exhausted', async () => {
        setUserPlanForTests('email-user', 'free');

        const limit = PLANS.free.limits.emailsPerDay;

        for (let index = 0; index < limit; index++) {
            const res = await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));

            expect(res.status).toBe(200);
        }

        const rejected = await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));

        expect(rejected.status).toBe(429);
        expect(rejected.headers.get('x-quota-limit')).toBe(String(limit));
        expect(await rejected.json()).toMatchObject({
            error: 'daily_quota_exceeded',
            metric: 'emails',
        });
    });

    it('does not consume the message quota when the email gate rejects', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(headerRequest({ Email: 'phil@example.com' }, 'email-user'));

        expect(res.status).toBe(403);
        expect(await getDailyUsage('email-user', 'messages')).toBe(0);
        expect(await getDailyUsage('email-user', 'emails')).toBe(0);
    });

    it('refunds the message quota when the email quota is exhausted', async () => {
        setUserPlanForTests('email-user', 'free');

        const limit = PLANS.free.limits.emailsPerDay;

        for (let index = 0; index < limit; index++) {
            await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));
        }

        expect(await getDailyUsage('email-user', 'messages')).toBe(limit);

        const rejected = await app.handle(headerRequest({ Email: 'yes' }, 'email-user'));

        expect(rejected.status).toBe(429);
        // The rejected publish created no message, so neither counter may move.
        expect(await getDailyUsage('email-user', 'messages')).toBe(limit);
        expect(await getDailyUsage('email-user', 'emails')).toBe(limit);
    });

    it('leaves publishes without an email address untouched', async () => {
        setUserPlanForTests('email-user', 'free');

        const res = await app.handle(jsonRequest({}, 'email-user'));

        expect(res.status).toBe(200);
        expect(mockSend).not.toHaveBeenCalled();
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
});
