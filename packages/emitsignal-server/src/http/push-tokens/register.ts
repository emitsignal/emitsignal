import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';

export const registerPushToken = new Elysia({ prefix: '/push-tokens' }).post(
    '/',
    async ({ body, headers, status }) => {
        const userId = await resolveUserId({ headers });

        const pushToken = await prisma.pushToken.findUnique({
            select: { id: true, userId: true },
            where: {
                deviceId_token: { deviceId: body.deviceId, token: body.token },
            },
        });

        // Don't let one caller reassign a token already owned by a different
        // account (that would redirect another user's notifications). Only the
        // owner — or an anonymous caller adopting an unowned token — may update it.
        if (pushToken && pushToken.userId && pushToken.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        const token = await prisma.pushToken.upsert({
            create: {
                deviceId: body.deviceId,
                platform: body.platform,
                token: body.token,
                userId,
            },
            update: {
                platform: body.platform,
                // Never downgrade an owned token to anonymous; only set ownership
                // when adopting a previously unowned token.
                ...(userId ? { userId } : {}),
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
