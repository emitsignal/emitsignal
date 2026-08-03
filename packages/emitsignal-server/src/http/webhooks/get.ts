import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { duration } from '#/lib/duration';
import { prisma } from '#/lib/prisma';

export const getWebhook = new Elysia().get('/webhooks/:id', async ({ headers, params, status }) => {
    const userId = await resolveUserId({ headers });

    if (!userId) {
        return status(401, { error: 'missing_token' });
    }

    const webhook = await prisma.webhook.findUnique({
        select: {
            createdAt: true,
            id: true,
            name: true,
            slug: true,
            source: true,
            status: true,
            template: true,
            topicName: true,
            updatedAt: true,
            userId: true,
        },
        where: { id: params.id },
    });

    if (!webhook) {
        return status(404, { error: 'not_found' });
    }

    if (webhook.userId !== userId) {
        return status(403, { error: 'forbidden' });
    }

    const since24h = new Date(Date.now() - duration.hours(24).as('ms'));

    const [count24h, lastDelivery] = await Promise.all([
        prisma.webhookDelivery.count({
            where: { createdAt: { gte: since24h }, webhookId: webhook.id },
        }),
        prisma.webhookDelivery.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
            where: { webhookId: webhook.id },
        }),
    ]);

    return {
        count24h,
        createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
        id: webhook.id,
        lastDeliveryAt: lastDelivery ? Math.floor(lastDelivery.createdAt.getTime() / 1000) : null,
        name: webhook.name,
        slug: webhook.slug,
        source: webhook.source,
        status: webhook.status,
        template: webhook.template,
        templated: !!webhook.template,
        topicName: webhook.topicName,
        updatedAt: Math.floor(webhook.updatedAt.getTime() / 1000),
    };
});
