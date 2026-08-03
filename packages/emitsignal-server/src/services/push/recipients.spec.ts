import { afterAll, describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import { resolvePushTokens } from './recipients';

describe('resolvePushTokens', () => {
    // These cases replace the shared mocks outright rather than queueing values,
    // so they must be handed back or later spec files inherit them.
    const originalSubscriptionFindMany = prismaMock.subscription.findMany;
    const originalPushTokenFindMany = prismaMock.pushToken.findMany;

    afterAll(() => {
        prismaMock.subscription.findMany = originalSubscriptionFindMany;
        prismaMock.pushToken.findMany = originalPushTokenFindMany;
    });

    it('returns an empty list when the topic has no subscriptions', async () => {
        prismaMock.subscription.findMany = mock(() => Promise.resolve([]));

        expect(await resolvePushTokens('topic-1')).toEqual([]);
    });

    it('deduplicates tokens', async () => {
        prismaMock.subscription.findMany = mock(() =>
            Promise.resolve([{ deviceId: 'device-1', userId: 'user-1' }]),
        );
        prismaMock.pushToken.findMany = mock(() =>
            Promise.resolve([{ token: 'ExpoToken[a]' }, { token: 'ExpoToken[a]' }]),
        );

        expect(await resolvePushTokens('topic-1')).toEqual(['ExpoToken[a]']);
    });

    it('only matches UNOWNED push tokens when resolving by deviceId', async () => {
        prismaMock.subscription.findMany = mock(() =>
            Promise.resolve([{ deviceId: 'victim-device', userId: null }]),
        );

        let capturedWhere: { OR: Array<Record<string, unknown>> } | undefined;

        // The shared mock is declared as a zero-arg function, so capture the
        // query through a cast rather than fighting its signature.
        prismaMock.pushToken.findMany = mock((...args: unknown[]) => {
            capturedWhere = (args[0] as { where: typeof capturedWhere }).where;

            return Promise.resolve([]);
        }) as unknown as typeof prismaMock.pushToken.findMany;

        await resolvePushTokens('topic-1');

        const deviceBranch = capturedWhere?.OR.find((branch) => 'deviceId' in branch);

        expect(deviceBranch).toBeDefined();
        expect(deviceBranch?.userId).toBeNull();
    });
});
