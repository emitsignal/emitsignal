import Elysia from 'elysia';

import { verifyToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';

export const me = new Elysia({ prefix: '/auth' }).get('/me', async ({ headers, status }) => {
    const authorization = (headers.authorization || '').trim();

    if (!authorization) {
        return status(401, { error: 'missing_token' });
    }

    const [, token] = authorization.split(' ');

    const userId = await verifyToken(token);

    if (!userId) {
        return status(401, { error: 'expired_session' });
    }

    const user = await prisma.user.findUnique({
        select: { email: true, id: true, name: true },
        where: { id: userId },
    });

    if (!user) {
        return status(401, { error: 'user_not_found' });
    }

    return { user };
});
