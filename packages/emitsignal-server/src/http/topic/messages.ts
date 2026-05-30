import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { prisma } from '../../lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '../../lib/rate-limit';
import { serializeMessage } from '../../lib/topic';

export const messages = new Elysia().get(
    '/topics/:name/messages',
    async ({ params, query, status }) => {
        const topic = await prisma.topic.findUnique({
            where: { name: params.name },
        });
        if (!topic) {
            return status(404, { error: 'topic_not_found' });
        }

        const messages = await prisma.message.findMany({
            include: { _count: { select: { acknowledgments: true } } },
            orderBy: { createdAt: 'desc' },
            take: query.limit ?? 50,
            where: { topicId: topic.id },
        });

        return Promise.all(
            messages.map((message) => serializeMessage(message, message._count.acknowledgments)),
        );
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({
            limit: t.Optional(t.Integer({ default: 50, maximum: 200, minimum: 1 })),
        }),
    },
);
