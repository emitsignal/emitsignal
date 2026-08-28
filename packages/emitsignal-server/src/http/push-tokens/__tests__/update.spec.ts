import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { updatePushToken } from '#/http/push-tokens/update';

describe('PATCH /push-tokens/:id', () => {
    const app = new Elysia().use(updatePushToken);

    function request(id: string, body: unknown) {
        return app.handle(
            new Request(`http://localhost/push-tokens/${id}`, {
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
                method: 'PATCH',
            }),
        );
    }

    beforeEach(() => {
        prismaMock.pushToken.findUnique.mockImplementation(() => Promise.resolve(null));
    });

    it('updates pushEnabled for the owner', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'user-1' });
        prismaMock.pushToken.update.mockResolvedValueOnce({
            deviceId: 'd1',
            id: 'pt-1',
            platform: 'ios',
            pushEnabled: false,
        });

        const res = await request('pt-1', { pushEnabled: false });
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({
            deviceId: 'd1',
            id: 'pt-1',
            platform: 'ios',
            pushEnabled: false,
        });
    });

    it('returns 401 when no auth', async () => {
        const res = await request('pt-1', { pushEnabled: true });
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data).toEqual({ error: 'missing_token' });
    });

    it('returns 404 when token not found', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        const res = await request('pt-nonexistent', { pushEnabled: true });
        expect(res.status).toBe(404);

        const data = await res.json();
        expect(data).toEqual({ error: 'not_found' });
    });

    it('returns 403 when user is not the owner', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'other-user' });

        const res = await request('pt-1', { pushEnabled: true });
        expect(res.status).toBe(403);

        const data = await res.json();
        expect(data).toEqual({ error: 'forbidden' });
    });

    it('returns 422 when pushEnabled is missing', async () => {
        const res = await request('pt-1', {});
        expect(res.status).toBe(422);
    });
});
