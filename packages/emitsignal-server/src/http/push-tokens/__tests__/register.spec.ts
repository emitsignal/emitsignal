import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/resolve-user-id', () => ({ resolveUserId: resolveUserIdMock }));

import { registerPushToken } from '#/http/push-tokens/register';

describe('POST /push-tokens', () => {
    const app = new Elysia().use(registerPushToken);

    function request(body: unknown) {
        return new Request('http://localhost/push-tokens', {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    function lastUpsertCreate() {
        const calls = prismaMock.pushToken.upsert.mock.calls;
        const callArgs = calls[calls.length - 1] as unknown as [
            {
                create: {
                    appId?: string;
                    deviceName?: string;
                    userId: null | string;
                };
            },
        ];
        return callArgs[0].create;
    }

    beforeEach(() => {
        resolveUserIdMock.mockResolvedValue(null);
    });

    it('registers a push token', async () => {
        const res = await app.handle(
            request({ deviceId: 'dev-1', platform: 'ios', token: 'expo-token-1' }),
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({ id: 'pt-1' });
    });

    it('derives userId from the session and ignores a body userId', async () => {
        // The caller is authenticated as user-1 but tries to bind the token to
        // user-2 via the body. The body value must be ignored.
        resolveUserIdMock.mockResolvedValueOnce('user-1');

        await app.handle(
            request({
                deviceId: 'dev-1',
                platform: 'android',
                token: 'token-2',
                userId: 'user-2',
            }),
        );

        expect(lastUpsertCreate().userId).toBe('user-1');
    });

    it('stores a null userId for an unauthenticated caller', async () => {
        await app.handle(request({ deviceId: 'dev-1', platform: 'web', token: 'token-3' }));

        expect(lastUpsertCreate().userId).toBeNull();
    });

    it('stores the device identity when the client sends it', async () => {
        await app.handle(
            request({
                appId: 'com.emitsignal.preview',
                deviceId: 'dev-1',
                deviceName: 'iPhone 15 Pro',
                platform: 'ios',
                token: 'token-4',
            }),
        );

        const create = lastUpsertCreate();

        expect(create.appId).toBe('com.emitsignal.preview');
        expect(create.deviceName).toBe('iPhone 15 Pro');
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
