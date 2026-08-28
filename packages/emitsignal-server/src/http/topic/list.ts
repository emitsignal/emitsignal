import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { prisma } from '#/lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';

export const listTopics = new Elysia().use(authPlugin).get(
    '/topics',
    async ({ query, userId }) => {
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
            accessMode: topic.accessMode,
            createdAt: topic.createdAt.getTime(),
            description: topic.description,
            displayName: topic.displayName,
            id: topic.id,
            isOwner: true,
            name: topic.name,
            ownerId: topic.ownerId,
        }));
    },
    {
        authOptional: true,
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({
            q: t.Optional(t.String()),
        }),
    },
);
