import Elysia, { t } from "elysia";

import { prisma } from "../../lib/prisma";
import { serializeMessage } from "../../lib/topic";

export const listMessages = new Elysia().get(
    "/topics/:name/messages",
    async ({ params, query, status }) => {
        const topic = await prisma.topic.findUnique({
            where: { name: params.name },
        });
        if (!topic) return status(404, { error: "topic_not_found" });

        const messages = await prisma.message.findMany({
            where: { topicId: topic.id },
            orderBy: { createdAt: "desc" },
            take: query.limit ?? 50,
        });

        return messages.map(serializeMessage);
    },
    {
        query: t.Object({
            limit: t.Optional(
                t.Integer({ minimum: 1, maximum: 200, default: 50 }),
            ),
        }),
    },
);
