import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';

export const registerPushToken = new Elysia({ prefix: '/push-tokens' }).post(
    '/',
    async ({ body }) => {
        const token = await prisma.pushToken.upsert({
            create: {
                deviceId: body.deviceId,
                platform: body.platform,
                token: body.token,
                ...(body.userId !== undefined ? { userId: body.userId } : {}),
            },
            update: {
                platform: body.platform,
                ...(body.userId !== undefined ? { userId: body.userId } : {}),
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
            userId: t.Optional(t.Nullable(t.String())),
        }),
    },
);
