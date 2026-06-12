import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('../../auth/plugin', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { resetUserPlansForTests, setUserPlanForTests } from '../../../lib/billing/get-user-plan';
import { PLANS } from '../../../lib/billing/plans';
import { createWebhook } from '../create';

describe('POST /webhooks', () => {
    const app = new Elysia().use(createWebhook);

    function request(userId?: string) {
        return new Request('http://localhost/webhooks', {
            body: JSON.stringify({ topicName: 'deploys' }),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUserPlansForTests();
        prismaMock.webhook.count.mockReset();
        prismaMock.webhook.count.mockResolvedValue(0);
    });

    it('returns 401 for anonymous requests', async () => {
        const res = await app.handle(request());

        expect(res.status).toBe(401);
    });

    it('creates a webhook under the plan limit', async () => {
        setUserPlanForTests('user-1', 'free');

        const res = await app.handle(request('user-1'));

        expect(res.status).toBe(200);
    });

    it('returns 403 once the plan webhook limit is reached', async () => {
        setUserPlanForTests('user-1', 'free');
        prismaMock.webhook.count.mockResolvedValue(PLANS.free.limits.maxWebhooks);

        const res = await app.handle(request('user-1'));

        expect(res.status).toBe(403);

        const data = await res.json();

        expect(data.error).toBe('plan_limit_reached');
        expect(data.metric).toBe('webhooks');
        expect(data.limit).toBe(PLANS.free.limits.maxWebhooks);
        expect(data.plan).toBe('free');
    });

    it('allows more webhooks on a paid plan', async () => {
        setUserPlanForTests('user-1', 'beam');
        prismaMock.webhook.count.mockResolvedValue(PLANS.free.limits.maxWebhooks);

        const res = await app.handle(request('user-1'));

        expect(res.status).toBe(200);
    });
});
