import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const deleteWebhook = new Elysia().delete(
    '/webhooks/:id',
    async ({ headers, params, status }) => {
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

        await prisma.webhook.delete({ where: { id: params.id } });

        return status(204);
    },
);
