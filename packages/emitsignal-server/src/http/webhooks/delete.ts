import Elysia from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const deleteWebhook = new Elysia().use(authPlugin).delete(
    '/webhooks/:id',
    async ({ params, status, userId }) => {
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

        await prisma.webhook.delete({ where: { id: params.id } });

        return status(204);
    },
    { authRequired: true },
);
