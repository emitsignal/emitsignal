import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import { resolveTopicCapabilities } from '#/services/topic-access';

export const getTopic = new Elysia().get('/topics/:name', async ({ headers, params, status }) => {
    const topic = await prisma.topic.findUnique({
        include: {
            _count: {
                select: { messages: true, subscriptions: true },
            },
        },
        where: { name: params.name },
    });

    if (!topic) {
        return status(404, { error: 'topic_not_found' });
    }

    const userId = await resolveUserId({ headers });
    const capabilities = await resolveTopicCapabilities(topic, userId);

    if (!capabilities.canRead) {
        return status(404, { error: 'topic_not_found' });
    }

    return {
        accessMode: topic.accessMode,
        createdAt: topic.createdAt.getTime(),
        description: topic.description,
        displayName: topic.displayName,
        id: topic.id,
        isOwner: capabilities.isOwner,
        messageCount: topic._count.messages,
        name: topic.name,
        ownerId: topic.ownerId,
        subscriberCount: topic._count.subscriptions,
    };
});
