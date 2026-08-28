import Elysia from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const listPushTokens = new Elysia({ prefix: '/push-tokens' }).use(authPlugin).get(
    '/',
    async ({ userId }) => {
        // `token` is deliberately absent: it is the delivery credential, and returning
        // it would let anyone reading this response push to the user's devices.
        const tokens = await prisma.pushToken.findMany({
            orderBy: { createdAt: 'desc' },
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
            where: { userId },
        });

        return tokens;
    },
    { authRequired: true },
);
