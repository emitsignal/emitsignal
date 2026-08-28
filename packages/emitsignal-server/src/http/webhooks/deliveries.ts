import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const listDeliveries = new Elysia().use(authPlugin).get(
    '/webhooks/:id/deliveries',
    async ({ params, query, status, userId }) => {
        const webhook = await prisma.webhook.findUnique({
            select: { source: true, topicName: true, userId: true },
            where: { id: params.id },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        const limit = Math.min(query.limit ?? 50, 200);

        const deliveries = await prisma.webhookDelivery.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                createdAt: true,
                expiresAt: true,
                id: true,
                messageId: true,
                ms: true,
                payload: true,
                status: true,
                templated: true,
                webhookId: true,
            },
            take: limit,
            where: { webhookId: params.id },
        });

        return deliveries.map((delivery) => ({
            channel: webhook.topicName,
            createdAt: Math.floor(delivery.createdAt.getTime() / 1000),
            durationMs: delivery.ms,
            expiresAt: delivery.expiresAt ? Math.floor(delivery.expiresAt.getTime() / 1000) : null,
            id: delivery.id,
            messageId: delivery.messageId,
            payload: JSON.parse(delivery.payload) as unknown,
            source: webhook.source,
            status: delivery.status,
            templated: delivery.templated,
            time: delivery.createdAt.toTimeString().slice(0, 8),
            webhookId: delivery.webhookId,
        }));
    },
    {
        authRequired: true,
        query: t.Object({ limit: t.Optional(t.Integer()) }),
    },
);
