import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { deletePushToken } from '#/http/push-tokens/delete';

describe('DELETE /push-tokens/:id', () => {
    const app = new Elysia().use(deletePushToken);

    function request(id: string) {
        return app.handle(new Request(`http://localhost/push-tokens/${id}`, { method: 'DELETE' }));
    }

    beforeEach(() => {
        prismaMock.pushToken.findUnique.mockImplementation(() => Promise.resolve(null));
        prismaMock.pushToken.delete.mockClear();
    });

    it('removes the token for the owner', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'user-1' });

        const res = await request('pt-1');

        expect(res.status).toBe(204);
        expect(prismaMock.pushToken.delete).toHaveBeenCalledWith({ where: { id: 'pt-1' } });
    });

    it('returns 401 when no auth', async () => {
        const res = await request('pt-1');

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'missing_token' });
        expect(prismaMock.pushToken.delete).not.toHaveBeenCalled();
    });

    it('returns 404 when token not found', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');

        const res = await request('pt-nonexistent');

        expect(res.status).toBe(404);

        const data = await res.json();

        expect(data).toEqual({ error: 'not_found' });
        expect(prismaMock.pushToken.delete).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not the owner', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'other-user' });

        const res = await request('pt-1');

        expect(res.status).toBe(403);

        const data = await res.json();

        expect(data).toEqual({ error: 'forbidden' });
        expect(prismaMock.pushToken.delete).not.toHaveBeenCalled();
    });
});
