import Elysia, { t } from "elysia";

import { Id } from "@notify/convex";

import { convex, api } from "../../lib/convex";

const authenticatedUser = "js74h8re3km62kg51wr0b8krd9815frv";

export const publishMessage = new Elysia().post(
    "/topic/:name",
    async ({ body, params }) => {
        let topic = await convex.query(api.queries.topics.getByName, {
            name: params.name,
        });

        if (!topic) {
            topic = await convex.mutation(api.mutations.topics.createTopic, {
                name: params.name,
                displayName: "",
                description: "",
                isPublic: true,
                userId: authenticatedUser as Id<"users">,
            });
        }

        if (!topic?.isPublic && topic?.ownerId !== authenticatedUser) {
            throw new Error("Not authorized to publish to this topic");
        }

        const messageId = await convex.mutation(
            api.mutations.messages.publishMessage,
            {
                topicId: topic._id,
                title: body.title,
                body: body.body,
                priority: body.priority as any,
                tags: body.tags,
                userId: authenticatedUser as Id<"users">,
            },
        );

        return {
            message: "posted",
            messageId,
        };
    },
    {
        body: t.Object({
            body: t.String(),
            priority: t.Number(),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
    },
);
