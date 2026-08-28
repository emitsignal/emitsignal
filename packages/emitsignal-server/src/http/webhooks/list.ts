import Elysia from 'elysia';

import { Prisma } from '#/generated/prisma/client';
import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import { duration } from '#/utils/duration';

export const listWebhooks = new Elysia().use(authPlugin).get(
    '/webhooks',
    async ({ userId }) => {
        const webhooks = await prisma.webhook.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                _count: { select: { deliveries: true } },
                createdAt: true,
                id: true,
                name: true,
                secretCiphertext: true,
                slug: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
                updatedAt: true,
                verification: true,
            },
            where: { userId },
        });

        const since24h = new Date(Date.now() - duration.hours(24).as('ms'));

        if (webhooks.length === 0) {
            return [];
        }

        const webhookIds = Prisma.join(webhooks.map((webhook) => webhook.id));

        const [countRows, lastRows] = await Promise.all([
            prisma.$queryRaw<Array<{ count: bigint; webhookId: string }>>`
            SELECT "webhookId", count(*) AS count
            FROM "WebhookDelivery"
            WHERE "webhookId" IN (${webhookIds}) AND "createdAt" >= ${since24h}
            GROUP BY "webhookId"
        `,
            prisma.$queryRaw<Array<{ lastDeliveryAt: Date; webhookId: string }>>`
            SELECT "webhookId", max("createdAt") AS "lastDeliveryAt"
            FROM "WebhookDelivery"
            WHERE "webhookId" IN (${webhookIds})
            GROUP BY "webhookId"
        `,
        ]);

        const countByWebhookId = new Map(
            countRows.map((row) => [row.webhookId, Number(row.count)]),
        );
        const lastDeliveryByWebhookId = new Map(
            lastRows.map((row) => [row.webhookId, row.lastDeliveryAt]),
        );

        return webhooks.map((webhook) => {
            const lastDeliveryAt = lastDeliveryByWebhookId.get(webhook.id);

            return {
                count24h: countByWebhookId.get(webhook.id) ?? 0,
                createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
                hasSecret: !!webhook.secretCiphertext,
                id: webhook.id,
                lastDeliveryAt: lastDeliveryAt ? Math.floor(lastDeliveryAt.getTime() / 1000) : null,
                name: webhook.name,
                slug: webhook.slug,
                source: webhook.source,
                status: webhook.status,
                templated: !!webhook.template,
                topicName: webhook.topicName,
                updatedAt: Math.floor(webhook.updatedAt.getTime() / 1000),
                verification: webhook.verification,
            };
        });
    },
    { authRequired: true },
);
