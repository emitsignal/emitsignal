import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const deletePushToken = new Elysia({ prefix: '/push-tokens' }).delete(
    '/:id',
    async ({ headers, params: { id }, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

        const pushToken = await prisma.pushToken.findUnique({
            select: { userId: true },
            where: { id },
        });

        if (!pushToken) {
            return status(404, { error: 'not_found' });
        }

        if (pushToken.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        await prisma.pushToken.delete({ where: { id } });

        return status(204);
    },
    {
        params: t.Object({
            id: t.String(),
        }),
    },
);
