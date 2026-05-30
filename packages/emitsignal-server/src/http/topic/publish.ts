import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { validateActions } from '../../lib/actions';
import { bus } from '../../lib/event-bus';
import { prisma } from '../../lib/prisma';
import { pushQueue, scheduleQueue } from '../../lib/queue';
import { publishAnonLimiter, publishAuthLimiter } from '../../lib/rate-limit';
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

        const validation = validateActions(body.actions);

        if ('error' in validation) {
            return { error: validation.error, status: 400 };
        }

        const actions = validation.actions;

        const message = await prisma.message.create({
            data: {
                actions: JSON.stringify(actions),
                body: body.body,
                priority: body.priority,
                scheduledAt: isScheduled ? new Date(scheduledAtUnix * 1000) : null,
                tags: serializeTags(body.tags),
                title: body.title,
                topicId: topic.id,
            },
        });

        if (isScheduled) {
            scheduleQueue.add(
                'schedule-delivery',
                { messageId: message.id },
                { delay: (scheduledAtUnix - now) * 1000 },
            );

            return { message: 'scheduled', messageId: message.id, scheduledAt: scheduledAtUnix };
        }

        const event = await serializeMessage({ ...message, topicId: topic.id }, 0, true);

        bus.publish(topic.name, { ...event, topicName: topic.name });

        pushQueue.add('push-message', {
            actions,
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
        beforeHandle: authAwareBeforeHandle(publishAnonLimiter, publishAuthLimiter),
        body: t.Object({
            actions: t.Optional(
                t.Array(
                    t.Object({
                        label: t.Optional(t.String()),
                        type: t.Union([t.Literal('acknowledge'), t.Literal('view')]),
                        url: t.Optional(t.String()),
                    }),
                    { maxItems: 2 },
                ),
            ),
            body: t.String(),
            priority: t.Integer({ maximum: 5, minimum: 1 }),
            scheduledAt: t.Optional(t.Integer()),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
    },
);
