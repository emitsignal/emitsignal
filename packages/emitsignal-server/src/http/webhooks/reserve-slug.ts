import { generateWebhookSlug } from '@emitsignal/shared/webhook-slug';
import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/resolve-user-id';
import { signSlugReservation } from '#/lib/crypto/slug-reservation';

export const reserveWebhookSlug = new Elysia().post(
    '/webhooks/slug',
    async ({ body, headers, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

        const slug = generateWebhookSlug(body?.source ?? 'custom');

        return {
            endpointUrl: `/h/${slug}`,
            reservation: signSlugReservation(slug),
            slug,
        };
    },
    {
        body: t.Optional(t.Object({ source: t.Optional(t.String()) })),
    },
);
