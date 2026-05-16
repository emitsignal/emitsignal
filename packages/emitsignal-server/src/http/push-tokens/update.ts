import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const updatePushToken = new Elysia({ prefix: '/push-tokens' }).patch(
    '/:id',
    async ({ body, headers, params: { id }, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

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
            select: { deviceId: true, id: true, platform: true, pushEnabled: true },
            where: { id },
        });

        return updated;
    },
    {
        body: t.Object({
            pushEnabled: t.Boolean(),
        }),
        params: t.Object({
            id: t.String(),
        }),
    },
);
