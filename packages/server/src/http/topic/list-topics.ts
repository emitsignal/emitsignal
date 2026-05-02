import Elysia, { t } from "elysia";

import { prisma } from "../../lib/prisma";

export const listTopics = new Elysia()
    .get(
        "/topics",
        async ({ query }) => {
            const search = query.q?.trim();
            const where = search
                ? {
                      OR: [{ name: { contains: search } }, { displayName: { contains: search } }],
                  }
                : {};

            const topics = await prisma.topic.findMany({
                orderBy: { createdAt: "desc" },
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
    )
    .get("/topics/:name", async ({ params, status }) => {
        const topic = await prisma.topic.findUnique({
            include: {
                _count: {
                    select: { messages: true, subscriptions: true },
                },
            },
            where: { name: params.name },
        });

        if (!topic) {
            return status(404, { error: "topic_not_found" });
        }

        return {
            createdAt: topic.createdAt.getTime(),
            description: topic.description,
            displayName: topic.displayName,
            id: topic.id,
            isPublic: topic.isPublic,
            messageCount: topic._count.messages,
            name: topic.name,
            subscriberCount: topic._count.subscriptions,
        };
    });
