import Elysia, { t } from "elysia";

import { prisma } from "../lib/prisma";

export const pushTokens = new Elysia({ prefix: "/push-tokens" }).post(
    "/",
    async ({ body }) => {
        const token = await prisma.pushToken.upsert({
            where: {
                deviceId_token: {
                    deviceId: body.deviceId,
                    token: body.token,
                },
            },
            update: {
                platform: body.platform,
            },
            create: {
                deviceId: body.deviceId,
                token: body.token,
                platform: body.platform,
            },
        });

        return { id: token.id };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            token: t.String({ minLength: 1 }),
            platform: t.Union([
                t.Literal("ios"),
                t.Literal("android"),
                t.Literal("web"),
            ]),
        }),
    },
);
