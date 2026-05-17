import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { verify } from '../../auth/verify';

describe('POST /auth/verify', () => {
    const app = new Elysia().use(verify);

    function request(body: unknown) {
        return new Request('http://localhost/auth/verify', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    it('returns token and user for a valid code', async () => {
        prismaMock.verificationCode.findFirst.mockResolvedValueOnce({
            code: 'abc123',
            consumed: false,
            createdAt: new Date(),
            email: 'user@test.com',
            expiresAt: new Date(Date.now() + 600_000),
            id: 'vc-1',
        });

        const res = await app.handle(request({ code: 'abc123', email: 'user@test.com' }));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.token).toBeString();
        expect(data.user).toHaveProperty('id', 'user-1');
        expect(data.user).toHaveProperty('email');
        expect(data.user).toHaveProperty('name', null);
    });

    it('returns 401 when code is invalid (not found)', async () => {
        prismaMock.verificationCode.findFirst.mockResolvedValueOnce(null);

        const res = await app.handle(request({ code: 'abc123', email: 'user@test.com' }));

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'invalid_or_expired_code' });
    });

    it('returns 401 when code is expired', async () => {
        prismaMock.verificationCode.findFirst.mockResolvedValueOnce({
            code: 'abc123',
            consumed: false,
            createdAt: new Date(),
            email: 'user@test.com',
            expiresAt: new Date(Date.now() - 1000),
            id: 'vc-1',
        });

        const res = await app.handle(request({ code: 'abc123', email: 'user@test.com' }));

        expect(res.status).toBe(401);

        const data = await res.json();

        expect(data).toEqual({ error: 'invalid_or_expired_code' });
    });

    it('returns 422 for invalid email format', async () => {
        const res = await app.handle(request({ code: 'abc123', email: 'not-an-email' }));

        expect(res.status).toBe(422);
    });

    it('returns 422 for missing fields', async () => {
        const res = await app.handle(request({ code: 'abc123' }));

        expect(res.status).toBe(422);
    });

    it('returns 422 for missing body', async () => {
        const res = await app.handle(
            new Request('http://localhost/auth/verify', {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(422);
    });
});
