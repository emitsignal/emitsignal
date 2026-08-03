import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import { serializeMessage } from '#/lib/topic';
import { resolveTopicCapabilities } from '#/lib/topic-access';

export const getMessage = new Elysia({ prefix: '/messages' }).get(
    '/:id',
    async ({ headers, params, status }) => {
        const message = await prisma.message.findUnique({
            include: {
                topic: { select: { accessMode: true, id: true, name: true, ownerId: true } },
            },
            where: { id: params.id },
        });

        if (!message) {
            return status(404, { error: 'message_not_found' });
        }

        // Enforce the topic access mode: a message is only readable by callers who
        // can read its topic. Return 404 (not 403) so we don't leak existence of
        // messages in private topics.
        const userId = await resolveUserId({ headers });
        const capabilities = await resolveTopicCapabilities(message.topic, userId);

        if (!capabilities.canRead) {
            return status(404, { error: 'message_not_found' });
        }

        const ackCount = await prisma.acknowledgment.count({
            where: { messageId: message.id },
        });

        const result = await serializeMessage(message, ackCount, true);

        return { ...result, topicName: message.topic.name };
    },
);
