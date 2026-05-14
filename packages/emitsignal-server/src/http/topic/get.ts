import Elysia from 'elysia';

import { prisma } from '../../lib/prisma';

export const getTopic = new Elysia().get('/topics/:name', async ({ params, status }) => {
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

    return {
        createdAt: topic.createdAt.getTime(),
        description: topic.description,
        displayName: topic.displayName,
        id: topic.id,
        isPublic: topic.isPublic,
        messageCount: topic._count.messages,
        name: topic.name,
        subscriberCount: topic._count.subscriptions,
    };
});
