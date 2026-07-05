import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const registerPushToken = new Elysia({ prefix: '/push-tokens' }).post(
    '/',
    async ({ body, headers }) => {
        const userId = await resolveUserId({ headers });

        const token = await prisma.pushToken.upsert({
            create: {
                deviceId: body.deviceId,
                platform: body.platform,
                token: body.token,
                userId,
            },
            update: {
                platform: body.platform,
                userId,
            },
            where: {
                deviceId_token: {
                    deviceId: body.deviceId,
                    token: body.token,
                },
            },
        });

        return { id: token.id };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            platform: t.Union([t.Literal('ios'), t.Literal('android'), t.Literal('web')]),
            token: t.String({ minLength: 1 }),
        }),
    },
);
