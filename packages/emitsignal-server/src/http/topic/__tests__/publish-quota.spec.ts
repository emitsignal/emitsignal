import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

const mockBus = { publish: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };
const mockScheduleQueue = { add: mock(() => Promise.resolve()) };

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/event-bus', () => ({ bus: mockBus }));
mock.module('#/lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: mockScheduleQueue,
}));
// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('#/http/auth/resolve-user-id', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { publish } from '#/http/topic/publish';
import { resetUserPlansForTests, setUserPlanForTests } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { resetUsageForTests } from '#/services/billing/usage';

describe('POST /publish/<topic> — plan quotas', () => {
    const app = new Elysia().use(publish);

    function request(userId?: string) {
        return new Request('http://localhost/publish/quota-topic', {
            body: JSON.stringify({
                body: 'Quota test',
                priority: 3,
                tags: [],
                title: 'Quota',
            }),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUsageForTests();
        resetUserPlansForTests();
    });

    it('allows publishes under the daily limit', async () => {
        setUserPlanForTests('quota-user', 'free');

        const res = await app.handle(request('quota-user'));

        expect(res.status).toBe(200);
    });

    it('returns 429 with quota headers once the daily limit is exhausted', async () => {
        setUserPlanForTests('quota-user', 'free');

        const limit = PLANS.free.limits.messagesPerDay;

        for (let index = 0; index < limit; index++) {
            const res = await app.handle(request('quota-user'));

            expect(res.status).toBe(200);
        }

        const rejected = await app.handle(request('quota-user'));

        expect(rejected.status).toBe(429);
        expect(rejected.headers.get('x-quota-limit')).toBe(String(limit));
        expect(rejected.headers.get('x-quota-remaining')).toBe('0');
        expect(Number(rejected.headers.get('retry-after'))).toBeGreaterThan(0);
        expect(rejected.headers.get('x-quota-reset')).not.toBeNull();

        const data = await rejected.json();

        expect(data.error).toBe('daily_quota_exceeded');
        expect(data.metric).toBe('messages');
        expect(data.limit).toBe(limit);
    });

    it('gives paid plans a higher daily limit', async () => {
        setUserPlanForTests('pulse-user', 'pulse');

        const freeLimit = PLANS.free.limits.messagesPerDay;

        for (let index = 0; index < freeLimit + 1; index++) {
            const res = await app.handle(request('pulse-user'));

            expect(res.status).toBe(200);
        }
    });

    it('does not apply plan quotas to anonymous publishers', async () => {
        const limit = PLANS.free.limits.messagesPerDay;

        for (let index = 0; index < limit + 5; index++) {
            const res = await app.handle(request());

            expect(res.status).toBe(200);
        }
    });

    it('tracks quotas per user', async () => {
        setUserPlanForTests('user-a', 'free');
        setUserPlanForTests('user-b', 'free');

        const limit = PLANS.free.limits.messagesPerDay;

        for (let index = 0; index < limit; index++) {
            await app.handle(request('user-a'));
        }

        expect((await app.handle(request('user-a'))).status).toBe(429);
        expect((await app.handle(request('user-b'))).status).toBe(200);
    });
});
