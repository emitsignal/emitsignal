import Elysia, { t } from "elysia";

import { prisma } from "../../lib/prisma";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function generateToken() {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export const verify = new Elysia({ prefix: "/auth" }).post(
    "/verify",
    async ({ body, status }) => {
        const email = body.email.toLowerCase().trim();
        const code = body.code.toLowerCase();

        const record = await prisma.verificationCode.findFirst({
            orderBy: { createdAt: "desc" },
            where: { code, consumed: false, email },
        });

        if (!record || record.expiresAt < new Date()) {
            return status(401, { error: "invalid_or_expired_code" });
        }

        await prisma.verificationCode.update({
            data: { consumed: true },
            where: { id: record.id },
        });

        const user = await prisma.user.upsert({
            create: { email },
            update: {},
            where: { email },
        });

        const token = generateToken();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

        await prisma.session.create({
            data: { expiresAt, token, userId: user.id },
        });

        return {
            expiresAt: expiresAt.getTime(),
            token,
            user: {
                email: user.email,
                id: user.id,
                name: user.name,
            },
        };
    },
    {
        body: t.Object({
            code: t.String({ maxLength: 6, minLength: 6 }),
            email: t.String({ format: "email" }),
        }),
    },
);
