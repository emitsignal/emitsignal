import Elysia from 'elysia';

import { duration } from '../../lib/duration';
import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const listWebhooks = new Elysia().get('/webhooks', async ({ headers, status }) => {
    const userId = await resolveUserId({ headers });

    if (!userId) {
        return status(401, { error: 'missing_token' });
    }

    const webhooks = await prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            _count: { select: { deliveries: true } },
            createdAt: true,
            id: true,
            name: true,
            slug: true,
            source: true,
            status: true,
            template: true,
            topicName: true,
            updatedAt: true,
        },
        where: { userId },
    });

    const since24h = new Date(Date.now() - duration.hours(24).as('ms'));

    const counts = await Promise.all(
        webhooks.map((webhook) =>
            prisma.webhookDelivery.count({
                where: { createdAt: { gte: since24h }, webhookId: webhook.id },
            }),
        ),
    );

    const lastDeliveries = await Promise.all(
        webhooks.map((webhook) =>
            prisma.webhookDelivery.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
                where: { webhookId: webhook.id },
            }),
        ),
    );

    return webhooks.map((webhook, index) => ({
        count24h: counts[index],
        createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
        id: webhook.id,
        lastDeliveryAt: lastDeliveries[index]
            ? Math.floor(lastDeliveries[index]!.createdAt.getTime() / 1000)
            : null,
        name: webhook.name,
        slug: webhook.slug,
        source: webhook.source,
        status: webhook.status,
        templated: !!webhook.template,
        topicName: webhook.topicName,
        updatedAt: Math.floor(webhook.updatedAt.getTime() / 1000),
    }));
});
