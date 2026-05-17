import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';
import { signToken } from '../../../lib/jwt';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { updatePushToken } from '../../push-tokens/update';

describe('PATCH /push-tokens/:id', () => {
    const app = new Elysia().use(updatePushToken);

    async function request(id: string, body: unknown, token?: string) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
            headers.authorization = token;
        }
        return app.handle(
            new Request(`http://localhost/push-tokens/${id}`, {
                body: JSON.stringify(body),
                headers,
                method: 'PATCH',
            }),
        );
    }

    beforeEach(() => {
        prismaMock.pushToken.findUnique.mockImplementation(() => Promise.resolve(null));
    });

    it('updates pushEnabled for the owner', async () => {
        const token = `Bearer ${await signToken('user-1')}`;

        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'user-1' });
        prismaMock.pushToken.update.mockResolvedValueOnce({
            deviceId: 'd1',
            id: 'pt-1',
            platform: 'ios',
            pushEnabled: false,
        });

        const res = await request('pt-1', { pushEnabled: false }, token);
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
        const token = `Bearer ${await signToken('user-1')}`;

        const res = await request('pt-nonexistent', { pushEnabled: true }, token);
        expect(res.status).toBe(404);

        const data = await res.json();
        expect(data).toEqual({ error: 'not_found' });
    });

    it('returns 403 when user is not the owner', async () => {
        const token = `Bearer ${await signToken('user-1')}`;

        prismaMock.pushToken.findUnique.mockResolvedValueOnce({ userId: 'other-user' });

        const res = await request('pt-1', { pushEnabled: true }, token);
        expect(res.status).toBe(403);

        const data = await res.json();
        expect(data).toEqual({ error: 'forbidden' });
    });

    it('returns 422 when pushEnabled is missing', async () => {
        const token = `Bearer ${await signToken('user-1')}`;

        const res = await request('pt-1', {}, token);
        expect(res.status).toBe(422);
    });
});
