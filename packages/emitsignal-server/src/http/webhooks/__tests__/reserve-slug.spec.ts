import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/http/auth/resolve-user-id', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { reserveWebhookSlug } from '#/http/webhooks/reserve-slug';
import { verifySlugReservation } from '#/lib/crypto/slug-reservation';

describe('POST /webhooks/slug', () => {
    const app = new Elysia().use(reserveWebhookSlug);

    function request(body: Record<string, unknown>, userId?: string) {
        return new Request('http://localhost/webhooks/slug', {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    it('returns 401 for anonymous requests', async () => {
        const res = await app.handle(request({ source: 'stripe' }));

        expect(res.status).toBe(401);
    });

    it('issues a slug for the source with a matching reservation', async () => {
        const res = await app.handle(request({ source: 'stripe' }, 'user-1'));
        const body = (await res.json()) as {
            endpointUrl: string;
            reservation: string;
            slug: string;
        };

        expect(res.status).toBe(200);
        expect(body.slug).toMatch(/^st_[a-z0-9]{16}$/);
        expect(body.endpointUrl).toBe(`/h/${body.slug}`);
        expect(verifySlugReservation(body.slug, body.reservation)).toBe(true);
    });

    it('falls back to the custom prefix for an unknown source', async () => {
        const res = await app.handle(request({ source: 'whatever' }, 'user-1'));
        const body = (await res.json()) as { slug: string };

        expect(body.slug).toMatch(/^cw_[a-z0-9]{16}$/);
    });

    it('does not issue the same slug twice', async () => {
        const first = (await (await app.handle(request({}, 'user-1'))).json()) as { slug: string };
        const second = (await (await app.handle(request({}, 'user-1'))).json()) as { slug: string };

        expect(first.slug).not.toBe(second.slug);
    });

    it('writes nothing to the database', async () => {
        prismaMock.webhook.create.mockClear();

        await app.handle(request({ source: 'stripe' }, 'user-1'));

        expect(prismaMock.webhook.create).not.toHaveBeenCalled();
    });
});
