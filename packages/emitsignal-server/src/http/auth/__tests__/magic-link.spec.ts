import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

const mockEmailSend = mock(() => Promise.resolve());

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/email-service', () => ({
    EmailService: {
        init: mock(),
        send: mockEmailSend,
    },
}));
mock.module('@emitsignal/emails', () => ({
    MagicLinkEmail: () => null,
    render: mock(() => Promise.resolve('<html>mock email</html>')),
}));

import { magicLink } from '../../auth/magic-link';

describe('POST /auth/magic-link', () => {
    const app = new Elysia().use(magicLink);

    beforeEach(() => {
        mockEmailSend.mockClear();
        prismaMock.verificationCode.create.mockClear();
    });

    it('creates verification code and sends email for valid email', async () => {
        const res = await app.handle(
            new Request('http://localhost/auth/magic-link', {
                body: JSON.stringify({ email: 'user@test.com' }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.ok).toBe(true);
        expect(data.expiresAt).toBeNumber();

        expect(prismaMock.verificationCode.create).toHaveBeenCalledTimes(1);
        expect(mockEmailSend).toHaveBeenCalledTimes(1);
    });

    it('sends email with correct parameters', async () => {
        await app.handle(
            new Request('http://localhost/auth/magic-link', {
                body: JSON.stringify({ email: 'user@test.com' }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        const call = mockEmailSend.mock.calls[0] as unknown as [Record<string, unknown>];

        expect(call[0]).toHaveProperty('to', 'user@test.com');
        expect(call[0]).toHaveProperty('html');
        expect(call[0]).toHaveProperty('subject');
    });

    it('returns 422 for invalid email format', async () => {
        const res = await app.handle(
            new Request('http://localhost/auth/magic-link', {
                body: JSON.stringify({ email: 'not-an-email' }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(422);
    });

    it('returns 422 for missing email', async () => {
        const res = await app.handle(
            new Request('http://localhost/auth/magic-link', {
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );

        expect(res.status).toBe(422);
    });
});
