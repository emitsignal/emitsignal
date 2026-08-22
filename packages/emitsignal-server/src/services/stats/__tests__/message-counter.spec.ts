import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import {
    flushMessageCounter,
    incrementMessageCounter,
    readMessageTotal,
    resetMessageCounterForTests,
} from '#/services/stats/message-counter';

function storedTotal(total: null | number): void {
    prismaMock.counter.findUnique = mock(() =>
        Promise.resolve(total === null ? null : { total: BigInt(total) }),
    );
}

beforeEach(() => {
    resetMessageCounterForTests();
    storedTotal(null);
    prismaMock.$executeRaw = mock(() => Promise.resolve(1));
});

describe('incrementMessageCounter', () => {
    it('counts each published message', async () => {
        await incrementMessageCounter();
        await incrementMessageCounter();
        await incrementMessageCounter();

        expect(await readMessageTotal()).toBe(3);
    });

    it('resumes from the stored total when the live counter is missing', async () => {
        storedTotal(500);

        await incrementMessageCounter();

        expect(await readMessageTotal()).toBe(501);
    });

    it('only folds the stored total in once', async () => {
        storedTotal(500);

        await incrementMessageCounter();
        await incrementMessageCounter();

        expect(await readMessageTotal()).toBe(502);
    });

    it('does not throw when the counter backend fails', async () => {
        storedTotal(10);
        prismaMock.counter.findUnique = mock(() => Promise.reject(new Error('redis down')));

        await expect(incrementMessageCounter()).resolves.toBeUndefined();
        expect(await readMessageTotal()).toBe(1);
    });
});

describe('readMessageTotal', () => {
    it('falls back to the stored total before anything is published', async () => {
        storedTotal(42);

        expect(await readMessageTotal()).toBe(42);
    });

    it('reports zero when neither the live nor the stored counter exists', async () => {
        expect(await readMessageTotal()).toBe(0);
    });
});

describe('flushMessageCounter', () => {
    it('writes nothing when the live counter is absent', async () => {
        await flushMessageCounter();

        expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    });

    it('persists the live total', async () => {
        await incrementMessageCounter();
        await flushMessageCounter();

        expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('is idempotent', async () => {
        await incrementMessageCounter();

        await flushMessageCounter();
        await flushMessageCounter();

        expect(await readMessageTotal()).toBe(1);
    });
});
