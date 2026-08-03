import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import { resolveTopicCapabilities } from '#/lib/topic-access';

export const acknowledge = new Elysia({ prefix: '/messages' }).post(
    '/:id/acknowledge',
    async ({ body, headers, params, status }) => {
        const message = await prisma.message.findUnique({
            select: {
                topic: { select: { accessMode: true, id: true, ownerId: true } },
            },
            where: { id: params.id },
        });

        if (!message) {
            return status(404, { error: 'message_not_found' });
        }

        // Attribution comes from the authenticated session, never the request
        // body — otherwise anyone could forge acknowledgments for any user. Only
        // callers who can read the topic may acknowledge its messages.
        const userId = await resolveUserId({ headers });
        const capabilities = await resolveTopicCapabilities(message.topic, userId);

        if (!capabilities.canRead) {
            return status(404, { error: 'message_not_found' });
        }

        await prisma.acknowledgment.upsert({
            create: {
                deviceId: body.deviceId,
                messageId: params.id,
                userId,
            },
            update: { userId },
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
        }),
    },
);
