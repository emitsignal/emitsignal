import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const updateWebhook = new Elysia().patch(
    '/webhooks/:id',
    async ({ body, headers, params, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

        const webhook = await prisma.webhook.findUnique({
            select: { userId: true },
            where: { id: params.id },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        const updated = await prisma.webhook.update({
            data: {
                name: body.name ?? undefined,
                status: body.status ?? undefined,
                template: body.template !== undefined ? body.template : undefined,
                topicName: body.topicName ?? undefined,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
            },
            where: { id: params.id },
        });

        return { ...updated, templated: !!updated.template };
    },
    {
        body: t.Object({
            name: t.Optional(t.String()),
            status: t.Optional(t.String()),
            template: t.Optional(t.Nullable(t.String())),
            topicName: t.Optional(t.String()),
        }),
        params: t.Object({ id: t.String() }),
    },
);
