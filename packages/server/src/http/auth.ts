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
                data: { code, email, expiresAt },
            });

            // In production: dispatch an email here. For dev, log + return code.
            console.log(`[auth] magic code for ${email}: ${code}`);

            return {
                // dev convenience — never expose in prod
                devCode: process.env.NODE_ENV === "production" ? undefined : code,
                expiresAt: expiresAt.getTime(),
                ok: true,
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
    )
    .get("/me", async ({ headers, status }) => {
        const auth = headers.authorization;
        if (!auth?.startsWith("Bearer ")) {
            return status(401, { error: "missing_token" });
        }
        const token = auth.slice(7);
        const session = await prisma.session.findUnique({
            include: { user: true },
            where: { token },
        });
        if (!session || session.expiresAt < new Date()) {
            return status(401, { error: "expired_session" });
        }
        return {
            user: {
                email: session.user.email,
                id: session.user.id,
                name: session.user.name,
            },
        };
    });
