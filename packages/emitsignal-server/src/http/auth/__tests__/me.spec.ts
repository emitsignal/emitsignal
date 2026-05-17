import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';
import { signToken } from '../../../lib/jwt';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { me } from '../../auth/me';

describe('GET /auth/me', () => {
    const app = new Elysia().use(me);

    async function request(token?: string) {
        const headers = new Headers();

        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return app.handle(new Request('http://localhost/auth/me', { headers }));
    }

    it('returns user for a valid token', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({
            email: 'user@test.com',
            id: 'user-1',
            name: 'Test User',
        });

        const token = await signToken('user-1');
        const res = await request(token);

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({
            user: { email: 'user@test.com', id: 'user-1', name: 'Test User' },
        });
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request();

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'missing_token' });
    });

    it('returns 401 for an invalid token', async () => {
        const res = await request('invalid-token');

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'expired_session' });
    });

    it('returns 401 when user is not found in DB', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(null);

        const token = await signToken('unknown-user');
        const res = await request(token);

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'user_not_found' });
    });
});
