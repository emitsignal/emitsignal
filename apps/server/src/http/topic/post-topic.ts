import Elysia, { t } from "elysia";
import { convex, api } from "../../lib/convex";
import { Id } from "@notify/convex";

export const postTopic = new Elysia().post(
    "/topic/:name",
    async ({ body, params }) => {
        const topicId = await convex.mutation(
            api.mutations.topics.createTopic,
            {
                name: params.name,
                displayName: body.displayName,
                description: body.description,
                isPublic: body.isPublic,
                userId: "js74h8re3km62kg51wr0b8krd9815frv" as Id<"users">,
            },
        );

        return {
            id: topicId,
            name: body.name,
            displayName: body.displayName,
            description: body.description,
            isPublic: body.isPublic,
        };
    },
    {
        body: t.Object({
            name: t.String(),
            displayName: t.String(),
            description: t.String(),
            isPublic: t.Boolean(),
        }),
    },
);
