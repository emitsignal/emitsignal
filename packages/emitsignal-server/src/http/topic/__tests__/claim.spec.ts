import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/http/auth/resolve-user-id', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { claimTopic } from '#/http/topic/claim';
import { resetUserPlansForTests, setUserPlanForTests } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';

function topicRow(overrides: Record<string, unknown> = {}) {
    return {
        accessMode: 'public',
        createdAt: new Date(1700000000000),
        description: '',
        displayName: 'x',
        id: 't1',
        name: 'x',
        ownerId: null,
        ...overrides,
    };
}

describe('POST /topics/:name/claim', () => {
    const app = new Elysia().use(claimTopic);

    function request(name: string, userId?: string, body: unknown = {}) {
        return new Request(`http://localhost/topics/${name}/claim`, {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUserPlansForTests();
        prismaMock.topic.findUnique.mockReset();
        prismaMock.topic.findUnique.mockResolvedValue(null);
        prismaMock.topic.count.mockReset();
        prismaMock.topic.count.mockResolvedValue(0);
        prismaMock.topic.create.mockReset();
        prismaMock.topic.create.mockResolvedValue(topicRow());
        prismaMock.topic.update.mockReset();
        prismaMock.topic.update.mockResolvedValue(topicRow());
        prismaMock.topicAccess.create.mockClear();
        prismaMock.topicAccess.upsert.mockClear();
    });

    it('returns 401 for anonymous requests', async () => {
        const res = await app.handle(request('reserved', undefined));

        expect(res.status).toBe(401);
    });

    it('returns 403 plan_required for free users', async () => {
        setUserPlanForTests('user-1', 'free');

        const res = await app.handle(request('reserved', 'user-1'));

        expect(res.status).toBe(403);

        const data = await res.json();

        expect(data.error).toBe('plan_required');
        expect(data.requiredPlans).toContain('pulse');
    });

    it('returns 400 for an invalid topic name', async () => {
        setUserPlanForTests('user-1', 'pulse');

        const res = await app.handle(request('has%20space', 'user-1'));

        expect(res.status).toBe(400);

        const data = await res.json();

        expect(data.error).toBe('invalid_topic_name');
    });

    it('reserves a new topic for a paid user', async () => {
        setUserPlanForTests('user-1', 'pulse');
        prismaMock.topic.create.mockResolvedValueOnce(
            topicRow({
                accessMode: 'private',
                name: 'reserved',
                ownerId: 'user-1',
            }),
        );

        const res = await app.handle(request('reserved', 'user-1', { accessMode: 'private' }));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.ownerId).toBe('user-1');
        expect(data.isOwner).toBe(true);
        expect(data.accessMode).toBe('private');
        expect(prismaMock.topicAccess.create).toHaveBeenCalled();
    });

    it('claims an existing ownerless topic', async () => {
        setUserPlanForTests('user-1', 'pulse');
        prismaMock.topic.findUnique.mockResolvedValueOnce(topicRow({ id: 't9', ownerId: null }));

        const res = await app.handle(request('adoptme', 'user-1'));

        expect(res.status).toBe(200);
        expect(prismaMock.topic.update).toHaveBeenCalled();
        expect(prismaMock.topicAccess.upsert).toHaveBeenCalled();
    });

    it('returns 409 when the topic is owned by someone else', async () => {
        setUserPlanForTests('user-1', 'pulse');
        prismaMock.topic.findUnique.mockResolvedValueOnce(topicRow({ ownerId: 'other-user' }));

        const res = await app.handle(request('taken', 'user-1'));

        expect(res.status).toBe(409);

        const data = await res.json();

        expect(data.error).toBe('already_claimed');
    });

    it('is idempotent when the caller already owns the topic', async () => {
        setUserPlanForTests('user-1', 'pulse');
        prismaMock.topic.findUnique.mockResolvedValueOnce(topicRow({ ownerId: 'user-1' }));

        const res = await app.handle(request('mine', 'user-1'));

        expect(res.status).toBe(200);
        // No new ownership acquired → the cap is never consulted.
        expect(prismaMock.topic.count).not.toHaveBeenCalled();
    });

    it('returns 403 plan_limit_reached at the owned-topics cap', async () => {
        setUserPlanForTests('user-1', 'pulse');
        prismaMock.topic.count.mockResolvedValueOnce(PLANS.pulse.limits.maxOwnedTopics);

        const res = await app.handle(request('one-too-many', 'user-1'));

        expect(res.status).toBe(403);

        const data = await res.json();

        expect(data.error).toBe('plan_limit_reached');
        expect(data.metric).toBe('owned_topics');
    });
});
