import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const listPushTokens = new Elysia({ prefix: '/push-tokens' }).get(
    '/',
    async ({ headers, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

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
);
