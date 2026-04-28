import Elysia, { t } from "elysia";

import { prisma } from "../lib/prisma";
import { getOrCreateTopic } from "../lib/topic";

export const subscriptions = new Elysia({ prefix: "/subscriptions" })
    .get(
        "/",
        async ({ query }) => {
            const subs = await prisma.subscription.findMany({
                where: { deviceId: query.deviceId },
                include: { topic: true },
                orderBy: { createdAt: "desc" },
            });

            return subs.map((s) => ({
                id: s.id,
                pushEnabled: s.pushEnabled,
                createdAt: s.createdAt.getTime(),
                topic: {
                    id: s.topic.id,
                    name: s.topic.name,
                    displayName: s.topic.displayName,
                    description: s.topic.description,
                    isPublic: s.topic.isPublic,
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
                where: {
                    deviceId_topicId: {
                        deviceId: body.deviceId,
                        topicId: topic.id,
                    },
                },
                update: {
                    pushEnabled: body.pushEnabled ?? true,
                },
                create: {
                    deviceId: body.deviceId,
                    topicId: topic.id,
                    pushEnabled: body.pushEnabled ?? true,
                },
            });

            return {
                id: sub.id,
                topic: {
                    id: topic.id,
                    name: topic.name,
                    displayName: topic.displayName,
                    description: topic.description,
                },
            };
        },
        {
            body: t.Object({
                deviceId: t.String({ minLength: 1 }),
                topicName: t.String({ minLength: 1 }),
                pushEnabled: t.Optional(t.Boolean()),
            }),
        },
    )
    .delete(
        "/",
        async ({ body }) => {
            const topic = await prisma.topic.findUnique({
                where: { name: body.topicName },
            });
            if (!topic) return { ok: true };

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
