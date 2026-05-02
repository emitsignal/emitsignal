import Elysia, { t } from "elysia";

import { prisma } from "../lib/prisma";
import { getOrCreateTopic } from "../lib/topic";

export const subscriptions = new Elysia({ prefix: "/subscriptions" })
    .get(
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
    )
    .post(
        "/",
        async ({ body }) => {
            const topic = await getOrCreateTopic(body.topicName);

            const sub = await prisma.subscription.upsert({
                create: {
                    deviceId: body.deviceId,
                    pushEnabled: body.pushEnabled ?? true,
                    topicId: topic.id,
                },
                update: {
                    pushEnabled: body.pushEnabled ?? true,
                },
                where: {
                    deviceId_topicId: {
                        deviceId: body.deviceId,
                        topicId: topic.id,
                    },
                },
            });

            return {
                id: sub.id,
                topic: {
                    description: topic.description,
                    displayName: topic.displayName,
                    id: topic.id,
                    name: topic.name,
                },
            };
        },
        {
            body: t.Object({
                deviceId: t.String({ minLength: 1 }),
                pushEnabled: t.Optional(t.Boolean()),
                topicName: t.String({ minLength: 1 }),
            }),
        },
    )
    .delete(
        "/",
        async ({ body }) => {
            const topic = await prisma.topic.findUnique({
                where: { name: body.topicName },
            });
            if (!topic) {
                return { ok: true };
            }

            await prisma.subscription
                .delete({
                    where: {
                        deviceId_topicId: {
                            deviceId: body.deviceId,
                            topicId: topic.id,
                        },
                    },
                })
                .catch(() => null);

            return { ok: true };
        },
        {
            body: t.Object({
                deviceId: t.String({ minLength: 1 }),
                topicName: t.String({ minLength: 1 }),
            }),
        },
    );
