import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('../../auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { listPushTokens } from '../../push-tokens/list';

describe('GET /push-tokens', () => {
    const app = new Elysia().use(listPushTokens);

    async function request() {
        return app.handle(new Request('http://localhost/push-tokens', {}));
    }

    it('returns push tokens for authenticated user', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.pushToken.findMany.mockResolvedValueOnce([
            { deviceId: 'd1', id: 'pt-1', platform: 'ios', pushEnabled: true },
        ]);

        const res = await request();
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual([{ deviceId: 'd1', id: 'pt-1', platform: 'ios', pushEnabled: true }]);
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
