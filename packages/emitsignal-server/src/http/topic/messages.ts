import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { prisma } from '#/lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';
import { serializeMessage } from '#/services/message';
import { resolveTopicCapabilities } from '#/services/topic-access';
import { parseTagsQueryParam } from '#/utils/tags';

export const messages = new Elysia().get(
    '/topics/:name/messages',
    async ({ headers, params, query, status }) => {
        const topic = await prisma.topic.findUnique({
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

        const limit = query.limit ?? 50;
        const tagsFilter = parseTagsQueryParam(query.tags);

        const messages = await prisma.message.findMany({
            include: { _count: { select: { acknowledgments: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            where: {
                topicId: topic.id,
                ...(query.minPriority !== undefined
                    ? { priority: { gte: query.minPriority } }
                    : {}),
                ...(tagsFilter.length > 0 ? { tags: { hasSome: tagsFilter } } : {}),
            },
        });

        const data = await Promise.all(
            messages.map((message) => serializeMessage(message, message._count.acknowledgments)),
        );

        const nextCursor =
            messages.length === limit ? (messages[messages.length - 1]?.id ?? null) : null;

        return { data, nextCursor };
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({
            cursor: t.Optional(t.String({ minLength: 1 })),
            limit: t.Optional(t.Integer({ default: 50, maximum: 200, minimum: 1 })),
            minPriority: t.Optional(t.Integer({ maximum: 5, minimum: 1 })),
            tags: t.Optional(t.String({ minLength: 1 })),
        }),
    },
);
