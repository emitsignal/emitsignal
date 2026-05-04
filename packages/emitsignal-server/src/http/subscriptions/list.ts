import Elysia, { t } from "elysia";

import { prisma } from "../../lib/prisma";

export const listSubscriptions = new Elysia({ prefix: "/subscriptions" }).get(
    "/",
    async ({ query }) => {
        const subscriptions = await prisma.subscription.findMany({
            include: { topic: true },
            orderBy: { createdAt: "desc" },
            where: { deviceId: query.deviceId },
        });

        return subscriptions.map((subscription) => ({
            createdAt: subscription.createdAt.getTime(),
            id: subscription.id,
            pushEnabled: subscription.pushEnabled,
            topic: {
                description: subscription.topic.description,
                displayName: subscription.topic.displayName,
                id: subscription.topic.id,
                isPublic: subscription.topic.isPublic,
                name: subscription.topic.name,
            },
        }));
    },
    {
        query: t.Object({ deviceId: t.String({ minLength: 1 }) }),
    },
);
