import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('#/http/auth/resolve-user-id', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { createWebhook } from '#/http/webhooks/create';
import { signSlugReservation } from '#/lib/crypto/slug-reservation';
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

describe('POST /webhooks signing secrets', () => {
    const app = new Elysia().use(createWebhook);

    function request(body: Record<string, unknown>) {
        return new Request('http://localhost/webhooks', {
            body: JSON.stringify({ topicName: 'deploys', ...body }),
            headers: { 'Content-Type': 'application/json', 'x-test-user-id': 'user-1' },
            method: 'POST',
        });
    }

    function storedData(): Record<string, unknown> {
        const calls = prismaMock.webhook.create.mock.calls;
        const lastCall = calls[calls.length - 1] as unknown as [{ data: Record<string, unknown> }];

        return lastCall[0].data;
    }

    beforeEach(() => {
        resetUserPlansForTests();
        setUserPlanForTests('user-1', 'free');
        prismaMock.webhook.count.mockReset();
        prismaMock.webhook.count.mockResolvedValue(0);
        prismaMock.webhook.create.mockClear();
        prismaMock.topic.findUnique.mockResolvedValue(null);
    });

    it('defaults to no verification when the fields are omitted', async () => {
        const res = await app.handle(request({}));

        expect(res.status).toBe(200);
        expect(storedData().verification).toBe('none');
        expect(storedData().secretCiphertext).toBeNull();
        expect((await res.json()).hasSecret).toBe(false);
    });

    it('encrypts the secret and never returns it', async () => {
        const res = await app.handle(
            request({ secret: 'super-secret-value', source: 'github', verification: 'github' }),
        );

        expect(res.status).toBe(200);

        const stored = storedData().secretCiphertext as string;

        expect(stored).toStartWith('v1.');
        expect(stored).not.toContain('super-secret-value');

        const payload = await res.json();

        expect(payload.hasSecret).toBe(true);
        expect(JSON.stringify(payload)).not.toContain('super-secret-value');
        expect(payload.secret).toBeUndefined();
        expect(payload.secretCiphertext).toBeUndefined();
    });

    it('rejects a verified webhook with no secret', async () => {
        const res = await app.handle(request({ verification: 'github' }));

        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('missing_secret');
        expect(prismaMock.webhook.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown verification scheme', async () => {
        const res = await app.handle(request({ secret: 'x', verification: 'paypal' }));

        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('invalid_verification_scheme');
    });

    it('rejects an hmac webhook without a usable config', async () => {
        const res = await app.handle(request({ secret: 'x', verification: 'hmac' }));

        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('invalid_verification_config');
    });

    it('stores the config for an hmac webhook', async () => {
        const verificationConfig = JSON.stringify({
            algorithm: 'sha256',
            header: 'x-signature',
        });

        const res = await app.handle(
            request({ secret: 'x', verification: 'hmac', verificationConfig }),
        );

        expect(res.status).toBe(200);
        expect(storedData().verificationConfig).toBe(verificationConfig);
    });

    it('drops a config that the chosen scheme does not use', async () => {
        const res = await app.handle(
            request({
                secret: 'x',
                verification: 'github',
                verificationConfig: JSON.stringify({ header: 'x-signature' }),
            }),
        );

        expect(res.status).toBe(200);
        expect(storedData().verificationConfig).toBeNull();
    });
});

describe('POST /webhooks reserved slug', () => {
    const app = new Elysia().use(createWebhook);

    function request(body: Record<string, unknown>) {
        return new Request('http://localhost/webhooks', {
            body: JSON.stringify({ topicName: 'deploys', ...body }),
            headers: { 'Content-Type': 'application/json', 'x-test-user-id': 'user-1' },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUserPlansForTests();
        setUserPlanForTests('user-1', 'free');
        prismaMock.webhook.count.mockReset();
        prismaMock.webhook.count.mockResolvedValue(0);
        prismaMock.webhook.create.mockReset();
        prismaMock.webhook.create.mockImplementation(
            ({ data }: { data: Record<string, unknown> }) =>
                Promise.resolve({
                    createdAt: new Date(),
                    id: 'wh-1',
                    name: 'stripe webhook',
                    slug: data.slug as string,
                    source: 'stripe',
                    status: 'active',
                    template: null,
                    topicName: 'deploys',
                    verification: 'none',
                    verificationConfig: null,
                }),
        );
        prismaMock.topic.findUnique.mockResolvedValue(null);
    });

    const RESERVED = 'st_abcdefghijklmnop';

    function reserved(slug = RESERVED) {
        return { reservation: signSlugReservation(slug), slug, source: 'stripe' };
    }

    it('uses a slug the server reserved', async () => {
        const res = await app.handle(request(reserved()));

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({ endpointUrl: `/h/${RESERVED}` });
    });

    it('rejects a slug sent without a reservation', async () => {
        const res = await app.handle(request({ slug: RESERVED, source: 'stripe' }));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_slug_reservation' });
    });

    it('rejects a reservation signed for a different slug', async () => {
        const res = await app.handle(
            request({
                reservation: signSlugReservation('st_zzzzzzzzzzzzzzzz'),
                slug: RESERVED,
                source: 'stripe',
            }),
        );

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_slug_reservation' });
    });

    it('rejects a reservation that has expired', async () => {
        const res = await app.handle(
            request({
                reservation: signSlugReservation(RESERVED, Date.now() - 2 * 60 * 60 * 1000),
                slug: RESERVED,
                source: 'stripe',
            }),
        );

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_slug_reservation' });
    });

    it('keeps a reserved slug whose prefix predates a source change', async () => {
        const slug = 'gh_abcdefghijklmnop';

        const res = await app.handle(
            request({ reservation: signSlugReservation(slug), slug, source: 'stripe' }),
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({ endpointUrl: `/h/${slug}` });
    });

    it('rejects a well-formed vanity slug a client chose for itself', async () => {
        const res = await app.handle(request({ slug: 'st_emitsignalcool12', source: 'stripe' }));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_slug_reservation' });
    });

    it('rejects a vanity slug that does not fit the generated shape', async () => {
        const slug = 'st_emitsignalcool';

        const res = await app.handle(
            request({ reservation: signSlugReservation(slug), slug, source: 'stripe' }),
        );

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_slug' });
    });

    it('returns 409 when the reserved slug was taken first', async () => {
        prismaMock.webhook.create.mockImplementation(() =>
            Promise.reject(Object.assign(new Error('unique'), { code: 'P2002' })),
        );

        const res = await app.handle(request(reserved()));

        expect(res.status).toBe(409);
        await expect(res.json()).resolves.toEqual({ error: 'slug_taken' });
    });

    it('generates a slug for the source when none is reserved', async () => {
        const res = await app.handle(request({ source: 'stripe' }));
        const body = (await res.json()) as { endpointUrl: string };

        expect(res.status).toBe(200);
        expect(body.endpointUrl).toMatch(/^\/h\/st_[a-z0-9]{16}$/);
    });
});
