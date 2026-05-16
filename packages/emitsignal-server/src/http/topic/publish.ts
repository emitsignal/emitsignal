import Elysia, { t } from 'elysia';

import { bus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { pushQueue, scheduleQueue } from '../../lib/queue';
import { getOrCreateTopic, serializeMessage, serializeTags } from '../../lib/topic';

const MAX_SCHEDULE_SECONDS = 365 * 24 * 60 * 60; // 1 year

export const publish = new Elysia().post(
    '/topic/:name',
    async ({ body, params }) => {
        const now = Math.floor(Date.now() / 1000);

        const scheduledAtUnix = body.scheduledAt;
        const isScheduled = scheduledAtUnix !== undefined && scheduledAtUnix > now;

        if (isScheduled && scheduledAtUnix - now > MAX_SCHEDULE_SECONDS) {
            return { error: 'scheduledAt cannot be more than 1 year in the future', status: 400 };
        }

        const topic = await getOrCreateTopic(params.name);

        const message = await prisma.message.create({
            data: {
                body: body.body,
                priority: body.priority,
                scheduledAt: isScheduled ? new Date(scheduledAtUnix * 1000) : null,
                tags: serializeTags(body.tags),
                title: body.title,
                topicId: topic.id,
            },
        });

        if (isScheduled) {
            logger.info(message, 'scheduled task');

            scheduleQueue.add(
                'schedule-delivery',
                { messageId: message.id },
                { delay: (scheduledAtUnix - now) * 1000 },
            );

            return { message: 'scheduled', messageId: message.id, scheduledAt: scheduledAtUnix };
        }

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
            scheduledAt: t.Optional(t.Integer()),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
    },
);
