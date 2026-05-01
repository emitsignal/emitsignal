import Elysia, { t } from "elysia";

import { prisma } from "../lib/prisma";

const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function generateCode() {
    // 6-char alphanumeric (mixed: digits + lowercase) — matches design "9 7 2 3 k 4"
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}

function generateToken() {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export const auth = new Elysia({ prefix: "/auth" })
    .post(
        "/magic-link",
        async ({ body }) => {
            const email = body.email.toLowerCase().trim();
            const code = generateCode();
            const expiresAt = new Date(Date.now() + CODE_TTL_MS);

            await prisma.verificationCode.create({
                data: { email, code, expiresAt },
            });

            // In production: dispatch an email here. For dev, log + return code.
            console.log(`[auth] magic code for ${email}: ${code}`);

            return {
                ok: true,
                expiresAt: expiresAt.getTime(),
                // dev convenience — never expose in prod
                devCode: process.env.NODE_ENV === "production" ? undefined : code,
            };
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
            }),
        },
    )
    .post(
        "/verify",
        async ({ body, status }) => {
            const email = body.email.toLowerCase().trim();
            const code = body.code.toLowerCase();

            const record = await prisma.verificationCode.findFirst({
                where: { email, code, consumed: false },
                orderBy: { createdAt: "desc" },
            });

            if (!record || record.expiresAt < new Date()) {
                return status(401, { error: "invalid_or_expired_code" });
            }

            await prisma.verificationCode.update({
                where: { id: record.id },
                data: { consumed: true },
            });

            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email },
            });

            const token = generateToken();
            const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

            await prisma.session.create({
                data: { token, userId: user.id, expiresAt },
            });

            return {
                token,
                expiresAt: expiresAt.getTime(),
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            };
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
                code: t.String({ minLength: 6, maxLength: 6 }),
            }),
        },
    )
    .get(
        "/me",
        async ({ headers, status }) => {
            const auth = headers.authorization;
            if (!auth?.startsWith("Bearer ")) {
                return status(401, { error: "missing_token" });
            }
            const token = auth.slice(7);
            const session = await prisma.session.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!session || session.expiresAt < new Date()) {
                return status(401, { error: "expired_session" });
            }
            return {
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                },
            };
        },
    );
