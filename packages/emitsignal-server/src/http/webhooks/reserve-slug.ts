import { generateWebhookSlug } from '@emitsignal/shared/webhook-slug';
import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { signSlugReservation } from '#/lib/crypto/slug-reservation';

export const reserveWebhookSlug = new Elysia().use(authPlugin).post(
    '/webhooks/slug',
    async ({ body }) => {
        const slug = generateWebhookSlug(body?.source ?? 'custom');

        return {
            endpointUrl: `/h/${slug}`,
            reservation: signSlugReservation(slug),
            slug,
        };
    },
    {
        authRequired: true,
        body: t.Optional(t.Object({ source: t.Optional(t.String()) })),
    },
);
