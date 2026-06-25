import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('../../auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { claimSubscriptions } from '../../subscriptions/claim';

describe('POST /subscriptions/claim', () => {
    const app = new Elysia().use(claimSubscriptions);

    function request(body: unknown) {
        return new Request('http://localhost/subscriptions/claim', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resolveUserIdMock.mockReset();
        prismaMock.subscription.updateMany.mockReset();
    });

    it('adopts the device anonymous subscriptions into the signed-in account', async () => {
        resolveUserIdMock.mockResolvedValueOnce('user-1');
        prismaMock.subscription.updateMany.mockResolvedValueOnce({ count: 2 });

        const res = await app.handle(request({ deviceId: 'dev-1' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ claimed: 2 });

        expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
            data: { userId: 'user-1' },
            where: { deviceId: 'dev-1', userId: null },
        });
    });

    it('does nothing when unauthenticated', async () => {
        resolveUserIdMock.mockResolvedValueOnce(null);

        const res = await app.handle(request({ deviceId: 'dev-1' }));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ claimed: 0 });
        expect(prismaMock.subscription.updateMany).not.toHaveBeenCalled();
    });

    it('returns 422 when deviceId is missing', async () => {
        const res = await app.handle(request({}));
        expect(res.status).toBe(422);
    });
});
