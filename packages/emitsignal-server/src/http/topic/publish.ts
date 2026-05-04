import Elysia, { t } from "elysia";

import { bus } from "../../lib/event-bus";
import { prisma } from "../../lib/prisma";
import { getOrCreateTopic, serializeMessage, serializeTags } from "../../lib/topic";

export const publish = new Elysia().post(
    "/topic/:name",
    async ({ body, params }) => {
        const topic = await getOrCreateTopic(params.name);

        const created = await prisma.message.create({
            data: {
                body: body.body,
                priority: body.priority,
                tags: serializeTags(body.tags),
                title: body.title,
                topicId: topic.id,
            },
        });

        const event = serializeMessage({ ...created, topicId: topic.id });

        bus.publish(topic.name, { ...event, topicName: topic.name });

        return { message: "posted", messageId: created.id };
    },
    {
        body: t.Object({
            body: t.String(),
            priority: t.Integer({ maximum: 5, minimum: 1 }),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
    },
);
