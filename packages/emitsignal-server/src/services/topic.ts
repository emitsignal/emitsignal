import { isValidTopicName } from '@emitsignal/shared';

import { topicNameCache } from '#/lib/cache';
import { prisma } from '#/lib/prisma';

export { isValidTopicName, TOPIC_NAME_MAX_LENGTH, TOPIC_NAME_REGEX } from '@emitsignal/shared';

export class TopicNameError extends Error {
    constructor(message = 'invalid topic name') {
        super(message);
        this.name = 'TopicNameError';
    }
}

export async function getOrCreateTopic(topicName: string) {
    const name = topicName.toLowerCase();

    if (!isValidTopicName(name)) {
        throw new TopicNameError();
    }

    const cached = topicNameCache.get(name);

    if (cached) {
        return cached;
    }

    const existing = await prisma.topic.findUnique({ where: { name } });

    if (existing) {
        topicNameCache.set(name, existing);

        return existing;
    }

    // Topics are always created ownerless. Ownership is explicit and paid:
    // see the claim route (POST /topics/:name/claim).
    const topic = await prisma.topic
        .create({
            data: {
                accessMode: 'public',
                description: '',
                displayName: name,
                name,
            },
        })
        .catch(async (error: unknown) => {
            // Concurrent create of the same topic — fetch the winner
            if ((error as { code?: string }).code === 'P2002') {
                const topic = await prisma.topic.findUnique({ where: { name } });

                if (topic) {
                    return topic;
                }
            }

            throw error;
        });

    topicNameCache.set(name, topic);

    return topic;
}
