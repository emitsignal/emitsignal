import Elysia, { t } from 'elysia';

import { bus } from '../../lib/event-bus';
import { prisma } from '../../lib/prisma';
import { pushQueue } from '../../lib/queue';
import { getOrCreateTopic, serializeMessage, serializeTags } from '../../lib/topic';

export const publish = new Elysia().post(
    '/topic/:name',
    async ({ body, params }) => {
        const topic = await getOrCreateTopic(params.name);

        const message = await prisma.message.create({
            data: {
                body: body.body,
                priority: body.priority,
                tags: serializeTags(body.tags),
                title: body.title,
                topicId: topic.id,
            },
        });

        const event = serializeMessage({ ...message, topicId: topic.id });

        bus.publish(topic.name, { ...event, topicName: topic.name });

        pushQueue.add('push-message', {
            body: body.body,
            messageId: message.id,
            priority: message.priority,
            title: body.title,
            topicDisplayName: topic.displayName,
            topicId: topic.id,
            topicName: topic.name,
        });

        return { message: 'posted', messageId: message.id };
    },
    {
        body: t.Object({
            body: t.String(),
            priority: t.Integer({ maximum: 5, minimum: 1 }),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
    },
);
