import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const claimSubscriptions = new Elysia({ prefix: '/subscriptions' }).post(
    '/claim',
    async ({ body, headers }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return { claimed: 0 };
        }

        // Adopt the device's anonymous subscriptions (userId IS NULL) into the
        // signed-in account so they carry forward and the device is left with a
        // clean anonymous slate after the next sign-out.
        const { count } = await prisma.subscription.updateMany({
            data: { userId },
            where: { deviceId: body.deviceId, userId: null },
        });

        return { claimed: count };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
        }),
    },
);
