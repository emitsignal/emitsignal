import Elysia from "elysia";

import { prisma } from "../../lib/prisma";

export const me = new Elysia({ prefix: "/auth" }).get("/me", async ({ headers, status }) => {
    const authorization = headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return status(401, { error: "missing_token" });
    }
    const token = authorization.slice(7);
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
