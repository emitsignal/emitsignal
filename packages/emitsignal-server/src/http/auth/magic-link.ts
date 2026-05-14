import Elysia, { t } from 'elysia';

import { trySendMagicLink } from '../../lib/email-service';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { environment } from '../../schema/environment';

const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode() {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';

    let code = '';

    for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return code;
}

export const magicLink = new Elysia({ prefix: '/auth' }).post(
    '/magic-link',
    async ({ body }) => {
        const email = body.email.toLowerCase().trim();
        const code = generateCode();
        const expiresAt = new Date(Date.now() + CODE_TTL_MS);
        const magicLinkUrl = `${environment.APP_URL}/auth/verify?email=${encodeURIComponent(email)}&code=${code}`;

        await prisma.verificationCode.create({
            data: { code, email, expiresAt },
        });

        logger.info({ code, email }, 'magic code issued');

        void trySendMagicLink({ code, email, expiresAt, magicLinkUrl });

        return {
            devCode: process.env.NODE_ENV === 'production' ? undefined : code,
            expiresAt: expiresAt.getTime(),
            ok: true,
        };
    },
    {
        body: t.Object({
            email: t.String({ format: 'email' }),
        }),
    },
);
