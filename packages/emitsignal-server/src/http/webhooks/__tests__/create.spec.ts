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

import { createWebhook } from '#/http/webhooks/create';
import { resetUserPlansForTests, setUserPlanForTests } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';

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
        prismaMock.topic.findUnique.mockResolvedValue(null);
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

    describe('target topic authorization', () => {
        it('returns 403 when targeting a private topic owned by someone else', async () => {
            setUserPlanForTests('user-1', 'free');

            prismaMock.topic.findUnique.mockResolvedValue({
                accessMode: 'private',
                id: 'topic-1',
                ownerId: 'victim-1',
            });
            prismaMock.topicAccess.findUnique.mockResolvedValue(null);

            const res = await app.handle(request('user-1'));

            expect(res.status).toBe(403);
            expect((await res.json()).error).toBe('forbidden');
        });

        it('returns 403 when targeting a readonly topic the caller cannot publish to', async () => {
            setUserPlanForTests('user-1', 'free');

            prismaMock.topic.findUnique.mockResolvedValue({
                accessMode: 'readonly',
                id: 'topic-1',
                ownerId: 'victim-1',
            });
            prismaMock.topicAccess.findUnique.mockResolvedValue(null);

            const res = await app.handle(request('user-1'));

            expect(res.status).toBe(403);
        });

        it('allows the topic owner to target their own private topic', async () => {
            setUserPlanForTests('user-1', 'free');

            prismaMock.topic.findUnique.mockResolvedValue({
                accessMode: 'private',
                id: 'topic-1',
                ownerId: 'user-1',
            });

            const res = await app.handle(request('user-1'));

            expect(res.status).toBe(200);
        });

        it('allows any user to target an unclaimed topic', async () => {
            setUserPlanForTests('user-1', 'free');

            prismaMock.topic.findUnique.mockResolvedValue({
                accessMode: 'public',
                id: 'topic-1',
                ownerId: null,
            });

            const res = await app.handle(request('user-1'));

            expect(res.status).toBe(200);
        });
    });
});
