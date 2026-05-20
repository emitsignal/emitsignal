import Elysia from 'elysia';

import { prisma } from '../../lib/prisma';
import { serializeMessage } from '../../lib/topic';

export const getMessage = new Elysia({ prefix: '/messages' }).get(
    '/:id',
    async ({ params, status }) => {
        const message = await prisma.message.findUnique({
            include: { topic: { select: { name: true } } },
            where: { id: params.id },
        });

        if (!message) {
            return status(404, { error: 'message_not_found' });
        }

        const ackCount = await prisma.acknowledgment.count({
            where: { messageId: message.id },
        });

        const result = await serializeMessage(message, ackCount, true);

        return { ...result, topicName: message.topic.name };
    },
);
