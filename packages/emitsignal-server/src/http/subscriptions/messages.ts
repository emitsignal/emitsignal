import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '../../lib/rate-limit';
import { parseSubscriptionSettings } from '../../lib/subscription-settings';
import { serializeMessage } from '../../lib/topic';
import { authAwareBeforeHandle } from '../plugins/rate-limit-plugin';
import { resolveSubscriptions } from './resolve';

export const listSubscriptionMessages = new Elysia({ prefix: '/subscriptions' }).get(
    '/messages',
    async ({ headers, query }) => {
        const { rows } = await resolveSubscriptions({ deviceId: query.deviceId, headers });

        const subscriptions = query.topicName
            ? rows.filter((row) => row.topic.name === query.topicName)
            : rows;

        if (subscriptions.length === 0) {
            return { data: [], nextCursor: null };
        }

        const messages = await prisma.message.findMany({
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            include: {
                _count: { select: { acknowledgments: true } },
                topic: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: query.limit,
            where: {
                OR: subscriptions.map((subscription) => {
                    const { listenSince } = parseSubscriptionSettings(subscription.settings);

                    if (listenSince === 'always') {
                        return { topicId: subscription.topicId };
                    }

                    return {
                        createdAt: { gte: subscription.createdAt },
                        topicId: subscription.topicId,
                    };
                }),
            },
        });

        const data = await Promise.all(
            messages.map(async (message) => {
                const serialized = await serializeMessage(
                    message,
                    message._count.acknowledgments,
                    false,
                );

                return { ...serialized, topicName: message.topic.name };
            }),
        );

        const nextCursor =
            messages.length === query.limit ? (messages[messages.length - 1]?.id ?? null) : null;

        return { data, nextCursor };
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({
            cursor: t.Optional(t.String({ minLength: 1 })),
            deviceId: t.Optional(t.String({ minLength: 1 })),
            limit: t.Optional(t.Integer({ default: 50, maximum: 200, minimum: 1 })),
            topicName: t.Optional(t.String({ minLength: 1 })),
        }),
    },
);
