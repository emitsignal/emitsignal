import Elysia, { t } from "elysia";

import { prisma } from "../../lib/prisma";

export const listTopics = new Elysia()
    .get(
        "/topics",
        async ({ query }) => {
            const search = query.q?.trim();
            const where = search
                ? {
                      OR: [
                          { name: { contains: search } },
                          { displayName: { contains: search } },
                      ],
                  }
                : {};

            const topics = await prisma.topic.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: 100,
            });

            return topics.map((t) => ({
                id: t.id,
                name: t.name,
                displayName: t.displayName,
                description: t.description,
                isPublic: t.isPublic,
                createdAt: t.createdAt.getTime(),
            }));
        },
        {
            query: t.Object({
                q: t.Optional(t.String()),
            }),
        },
    )
    .get(
        "/topics/:name",
        async ({ params, status }) => {
            const topic = await prisma.topic.findUnique({
                where: { name: params.name },
                include: {
                    _count: {
                        select: { messages: true, subscriptions: true },
                    },
                },
            });

            if (!topic) return status(404, { error: "topic_not_found" });

            return {
                id: topic.id,
                name: topic.name,
                displayName: topic.displayName,
                description: topic.description,
                isPublic: topic.isPublic,
                createdAt: topic.createdAt.getTime(),
                messageCount: topic._count.messages,
                subscriberCount: topic._count.subscriptions,
            };
        },
    );
