import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const deletePushToken = new Elysia({ prefix: '/push-tokens' }).use(authPlugin).delete(
    '/:id',
    async ({ params: { id }, status, userId }) => {
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
        authRequired: true,
        params: t.Object({
            id: t.String(),
        }),
    },
);
