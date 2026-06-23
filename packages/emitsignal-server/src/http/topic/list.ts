import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { prisma } from '../../lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '../../lib/rate-limit';
import { resolveUserId } from '../auth/plugin';

export const listTopics = new Elysia().get(
    '/topics',
    async ({ headers, query }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return [];
        }

        const search = query.q?.trim();
        const where = {
            ownerId: userId,
            ...(search
                ? {
                      OR: [{ name: { contains: search } }, { displayName: { contains: search } }],
                  }
                : {}),
        };

        const topics = await prisma.topic.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            where,
        });

        return topics.map((topic) => ({
            createdAt: topic.createdAt.getTime(),
            description: topic.description,
            displayName: topic.displayName,
            id: topic.id,
            isPublic: topic.isPublic,
            name: topic.name,
        }));
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({
            q: t.Optional(t.String()),
        }),
    },
);
