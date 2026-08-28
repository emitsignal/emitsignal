import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { authPlugin } from '#/http/auth/plugin';

const app = new Elysia()
    .use(authPlugin)
    .get('/only', ({ userId }) => ({ userId }), { authRequired: true })
    .get('/optional', ({ userId }) => ({ userId }), { authOptional: true });

async function request(path: string) {
    return app.handle(new Request(`http://localhost${path}`));
}

describe('authRequired', () => {
    it('rejects anonymous callers with 401 missing_token', async () => {
        resolveUserIdMock.mockResolvedValueOnce(null);

        const response = await request('/only');

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'missing_token' });
    });

    it('passes the resolved user id to the handler', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');

        const response = await request('/only');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ userId: 'user-1' });
    });
});

describe('authOptional', () => {
    it('yields null for anonymous callers instead of rejecting', async () => {
        resolveUserIdMock.mockResolvedValueOnce(null);

        const response = await request('/optional');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ userId: null });
    });

    it('yields the resolved user id when authenticated', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');

        const response = await request('/optional');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ userId: 'user-1' });
    });
});
