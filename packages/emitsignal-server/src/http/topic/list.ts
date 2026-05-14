import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';

export const listTopics = new Elysia().get(
    '/topics',
    async ({ query }) => {
        const search = query.q?.trim();
        const where = search
            ? {
                  OR: [{ name: { contains: search } }, { displayName: { contains: search } }],
              }
            : {};

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
        query: t.Object({
            q: t.Optional(t.String()),
        }),
    },
);
