import Elysia, { t } from 'elysia';

import { signToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';

export const verify = new Elysia({ prefix: '/auth' }).post(
    '/verify',
    async ({ body, status }) => {
        const email = body.email.toLowerCase().trim();

        const record = await prisma.verificationCode.findFirst({
            orderBy: { createdAt: 'desc' },
            where: { code: body.code.toLowerCase(), consumed: false, email },
        });

        if (!record || record.expiresAt < new Date()) {
            return status(401, { error: 'invalid_or_expired_code' });
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

        const token = await signToken(user.id);

        return {
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
            email: t.String({ format: 'email' }),
        }),
    },
);
