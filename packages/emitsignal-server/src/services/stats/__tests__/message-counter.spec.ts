import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import {
    flushMessageCounter,
    incrementMessageCounter,
    loadMessageCounter,
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

describe('loadMessageCounter', () => {
    it('seeds the total from the stored row', async () => {
        storedTotal(500);

        await loadMessageCounter();

        expect(readMessageTotal()).toBe(500);
    });

    it('starts at zero when no row exists yet', async () => {
        await loadMessageCounter();

        expect(readMessageTotal()).toBe(0);
    });

    it('does not throw when the stored total cannot be read', async () => {
        prismaMock.counter.findUnique = mock(() => Promise.reject(new Error('database down')));

        await expect(loadMessageCounter()).resolves.toBeUndefined();
        expect(readMessageTotal()).toBe(0);
    });
});

describe('incrementMessageCounter', () => {
    it('counts each published message', () => {
        incrementMessageCounter();
        incrementMessageCounter();
        incrementMessageCounter();

        expect(readMessageTotal()).toBe(3);
    });

    it('continues from the seeded total', async () => {
        storedTotal(500);

        await loadMessageCounter();
        incrementMessageCounter();

        expect(readMessageTotal()).toBe(501);
    });
});

describe('flushMessageCounter', () => {
    it('writes nothing when nothing was counted', async () => {
        await flushMessageCounter();

        expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    });

    it('persists the total after an increment', async () => {
        incrementMessageCounter();

        await flushMessageCounter();

        expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('skips the write when no message arrived since the last flush', async () => {
        incrementMessageCounter();

        await flushMessageCounter();
        await flushMessageCounter();

        expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
        expect(readMessageTotal()).toBe(1);
    });

    it('keeps the total pending when the write fails', async () => {
        incrementMessageCounter();
        prismaMock.$executeRaw = mock(() => Promise.reject(new Error('database down')));

        await expect(flushMessageCounter()).resolves.toBeUndefined();

        prismaMock.$executeRaw = mock(() => Promise.resolve(1));

        await flushMessageCounter();

        expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    });
});
