import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('#/http/auth/plugin', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { getBilling } from '#/http/billing/get';
import { resetUserPlansForTests } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { consumeDailyQuota, resetUsageForTests } from '#/services/billing/usage';

describe('GET /billing', () => {
    const app = new Elysia().use(getBilling);

    function request(userId?: string) {
        return new Request('http://localhost/billing', {
            headers: userId ? { 'x-test-user-id': userId } : {},
        });
    }

    beforeEach(() => {
        resetUsageForTests();
        resetUserPlansForTests();
        prismaMock.planSubscription.findFirst.mockReset();
        prismaMock.planSubscription.findFirst.mockResolvedValue(null);
        prismaMock.topic.count.mockReset();
        prismaMock.topic.count.mockResolvedValue(0);
        prismaMock.webhook.count.mockReset();
        prismaMock.webhook.count.mockResolvedValue(0);
    });

    it('returns 401 for anonymous requests', async () => {
        const res = await app.handle(request());

        expect(res.status).toBe(401);
    });

    it('returns the free plan shape for a user without a subscription', async () => {
        const res = await app.handle(request('user-free'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.plan).toBe('free');
        expect(data.limits).toEqual(PLANS.free.limits);
        expect(data.subscription).toBeNull();
        expect(data.usage).toEqual({
            emailsToday: 0,
            messagesToday: 0,
            ownedTopics: 0,
            webhooks: 0,
        });
        expect(typeof data.billingEnabled).toBe('boolean');
    });

    it('returns the paid plan with the subscription block', async () => {
        const periodEnd = new Date(Date.now() + 86_400_000);

        prismaMock.planSubscription.findFirst.mockResolvedValue({
            billingInterval: 'month',
            cancelAtPeriodEnd: false,
            id: 'plan-sub-1',
            periodEnd,
            plan: 'pulse',
            referenceId: 'user-pulse',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
        });
        prismaMock.topic.count.mockResolvedValue(3);
        prismaMock.webhook.count.mockResolvedValue(2);

        const res = await app.handle(request('user-pulse'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.plan).toBe('pulse');
        expect(data.limits).toEqual(PLANS.pulse.limits);
        expect(data.subscription).toEqual({
            cancelAtPeriodEnd: false,
            interval: 'month',
            periodEnd: Math.floor(periodEnd.getTime() / 1000),
            status: 'active',
            stripeSubscriptionId: 'sub_123',
        });
        expect(data.usage.ownedTopics).toBe(3);
        expect(data.usage.webhooks).toBe(2);
    });

    it('reports daily usage counters', async () => {
        await consumeDailyQuota('user-free', 'messages', 100);
        await consumeDailyQuota('user-free', 'messages', 100);
        await consumeDailyQuota('user-free', 'emails', 5);

        const res = await app.handle(request('user-free'));
        const data = await res.json();

        expect(data.usage.messagesToday).toBe(2);
        expect(data.usage.emailsToday).toBe(1);
    });
});
