import Elysia from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import { serializeMessage } from '#/services/message';
import { resolveTopicCapabilities } from '#/services/topic-access';

export const getMessage = new Elysia({ prefix: '/messages' }).use(authPlugin).get(
    '/:id',
    async ({ params, status, userId }) => {
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
    { authOptional: true },
);
