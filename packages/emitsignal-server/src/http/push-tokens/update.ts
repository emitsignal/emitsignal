import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const updatePushToken = new Elysia({ prefix: '/push-tokens' }).use(authPlugin).patch(
    '/:id',
    async ({ body, params: { id }, status, userId }) => {
        const token = await prisma.pushToken.findUnique({
            select: { userId: true },
            where: { id },
        });

        if (!token) {
            return status(404, { error: 'not_found' });
        }

        if (token.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        const updated = await prisma.pushToken.update({
            data: { pushEnabled: body.pushEnabled },
            select: {
                appId: true,
                createdAt: true,
                deviceId: true,
                deviceName: true,
                id: true,
                platform: true,
                pushEnabled: true,
                updatedAt: true,
            },
            where: { id },
        });

        return updated;
    },
    {
        authRequired: true,
        body: t.Object({
            pushEnabled: t.Boolean(),
        }),
        params: t.Object({
            id: t.String(),
        }),
    },
);
