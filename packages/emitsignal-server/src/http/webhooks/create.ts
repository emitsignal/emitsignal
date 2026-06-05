import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

function randomSlug(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOURCE_PREFIX: Record<string, string> = {
    custom: 'cu',
    github: 'gh',
    grafana: 'gf',
    stripe: 'st',
    vercel: 'vc',
};

export const createWebhook = new Elysia().post(
    '/webhooks',
    async ({ body, headers, status }) => {
        const userId = await resolveUserId({ headers });
        if (!userId) return status(401, { error: 'missing_token' });

        const prefix = SOURCE_PREFIX[body.source ?? 'custom'] ?? 'cu';
        const slug = randomSlug(prefix);

        const webhook = await prisma.webhook.create({
            data: {
                name: body.name || `${body.source ?? 'custom'} webhook`,
                slug,
                source: body.source ?? 'custom',
                template: body.template ?? null,
                topicName: body.topicName,
                userId,
            },
            select: {
                createdAt: true,
                id: true,
                name: true,
                slug: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
            },
        });

        return {
            ...webhook,
            createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
            endpointUrl: `/h/${webhook.slug}`,
            templated: !!webhook.template,
        };
    },
    {
        body: t.Object({
            name: t.Optional(t.String()),
            source: t.Optional(t.String({ default: 'custom' })),
            template: t.Optional(t.Nullable(t.String())),
            topicName: t.String(),
        }),
    },
);
