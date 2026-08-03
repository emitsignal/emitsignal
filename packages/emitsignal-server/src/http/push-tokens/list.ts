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

        const tokens = await prisma.pushToken.findMany({
            orderBy: { createdAt: 'desc' },
            select: { deviceId: true, id: true, platform: true, pushEnabled: true },
            where: { userId },
        });

        return tokens;
    },
);
