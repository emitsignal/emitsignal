import Elysia, { t } from "elysia";

import { bus } from "../../lib/event-bus";
import { prisma } from "../../lib/prisma";
import {
    getOrCreateTopic,
    serializeMessage,
    serializeTags,
} from "../../lib/topic";

export const publishMessage = new Elysia().post(
    "/topic/:name",
    async ({ body, params }) => {
        const topic = await getOrCreateTopic(params.name);

        const created = await prisma.message.create({
            data: {
                topicId: topic.id,
                title: body.title,
                body: body.body,
                priority: body.priority,
                tags: serializeTags(body.tags),
            },
        });

        const event = serializeMessage({ ...created, topicId: topic.id });
        bus.publish(topic.name, { ...event, topicName: topic.name });

        return { message: "posted", messageId: created.id };
    },
    {
        body: t.Object({
            title: t.String(),
            body: t.String(),
            priority: t.Integer({ minimum: 1, maximum: 5 }),
            tags: t.Array(t.String()),
        }),
    },
);
