import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { registerPushToken } from '../../push-tokens/register';

describe('POST /push-tokens', () => {
    const app = new Elysia().use(registerPushToken);

    function request(body: unknown) {
        return new Request('http://localhost/push-tokens', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    it('registers a push token', async () => {
        const res = await app.handle(
            request({ deviceId: 'dev-1', platform: 'ios', token: 'expo-token-1' }),
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ id: 'pt-1' });
    });

    it('stores userId when provided', async () => {
        await app.handle(
            request({
                deviceId: 'dev-1',
                platform: 'android',
                token: 'token-2',
                userId: 'user-1',
            }),
        );

        const callArgs = prismaMock.pushToken.upsert.mock.calls[
            prismaMock.pushToken.upsert.mock.calls.length - 1
        ] as unknown as [{ create: { userId: string | undefined } }];
        expect(callArgs[0].create.userId).toBe('user-1');
    });

    it('omits userId from create when not provided', async () => {
        await app.handle(request({ deviceId: 'dev-1', platform: 'web', token: 'token-3' }));

        const callArgs = prismaMock.pushToken.upsert.mock.calls[
            prismaMock.pushToken.upsert.mock.calls.length - 1
        ] as unknown as [{ create: Record<string, unknown> }];
        expect(callArgs[0].create).not.toHaveProperty('userId');
    });

    it('returns 422 for missing required fields', async () => {
        const res = await app.handle(request({ platform: 'ios' }));
        expect(res.status).toBe(422);
    });

    it('returns 422 for invalid platform', async () => {
        const res = await app.handle(request({ deviceId: 'd1', platform: 'unknown', token: 't1' }));
        expect(res.status).toBe(422);
    });
});
