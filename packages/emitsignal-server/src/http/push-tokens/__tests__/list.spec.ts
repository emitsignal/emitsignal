import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { listPushTokens } from '#/http/push-tokens/list';

describe('GET /push-tokens', () => {
    const app = new Elysia().use(listPushTokens);

    async function request() {
        return app.handle(new Request('http://localhost/push-tokens', {}));
    }

    it('returns push tokens for authenticated user', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findMany.mockResolvedValueOnce([
            {
                appId: 'com.emitsignal.preview',
                createdAt: new Date('2026-08-01T00:00:00.000Z'),
                deviceId: 'd1',
                deviceName: 'iPhone 15 Pro',
                id: 'pt-1',
                platform: 'ios',
                pushEnabled: true,
                updatedAt: new Date('2026-08-10T00:00:00.000Z'),
            },
        ]);

        const res = await request();
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual([
            {
                appId: 'com.emitsignal.preview',
                createdAt: '2026-08-01T00:00:00.000Z',
                deviceId: 'd1',
                deviceName: 'iPhone 15 Pro',
                id: 'pt-1',
                platform: 'ios',
                pushEnabled: true,
                updatedAt: '2026-08-10T00:00:00.000Z',
            },
        ]);
    });

    it('never selects the delivery token', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        await request();

        const calls = prismaMock.pushToken.findMany.mock.calls;
        const [args] = calls[calls.length - 1] as unknown as [{ select: Record<string, boolean> }];

        expect(args.select.token).toBeUndefined();
    });

    it('returns 401 when no auth header', async () => {
        const res = await app.handle(new Request('http://localhost/push-tokens'));
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data).toEqual({ error: 'missing_token' });
    });

    it('returns empty array when user has no tokens', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        const res = await request();
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual([]);
    });
});
