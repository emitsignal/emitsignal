import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';

export const acknowledge = new Elysia({ prefix: '/messages' }).post(
    '/:id/acknowledge',
    async ({ body, params }) => {
        await prisma.acknowledgment.upsert({
            create: {
                deviceId: body.deviceId,
                messageId: params.id,
                userId: body.userId ?? null,
            },
            update: {},
            where: {
                messageId_deviceId: {
                    deviceId: body.deviceId,
                    messageId: params.id,
                },
            },
        });

        const count = await prisma.acknowledgment.count({
            where: { messageId: params.id },
        });

        return { acknowledged: true, count };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            userId: t.Optional(t.String()),
        }),
    },
);
