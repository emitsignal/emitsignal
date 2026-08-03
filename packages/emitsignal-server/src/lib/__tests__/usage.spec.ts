import { beforeEach, describe, expect, it } from 'bun:test';

import {
    consumeDailyQuota,
    getDailyUsage,
    quotaExceededHeaders,
    resetUsageForTests,
} from '#/lib/billing/usage';

beforeEach(() => {
    resetUsageForTests();
});

describe('consumeDailyQuota', () => {
    it('allows consumption under the limit', async () => {
        const result = await consumeDailyQuota('user-1', 'messages', 3);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
        expect(result.limit).toBe(3);
    });

    it('flips allowed to false past the limit', async () => {
        await consumeDailyQuota('user-1', 'messages', 2);
        await consumeDailyQuota('user-1', 'messages', 2);

        const third = await consumeDailyQuota('user-1', 'messages', 2);

        expect(third.allowed).toBe(false);
        expect(third.remaining).toBe(0);
    });

    it('allows exactly the limit', async () => {
        await consumeDailyQuota('user-1', 'messages', 2);

        const second = await consumeDailyQuota('user-1', 'messages', 2);

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(0);
    });

    it('tracks metrics independently', async () => {
        await consumeDailyQuota('user-1', 'messages', 5);
        await consumeDailyQuota('user-1', 'emails', 5);

        expect(await getDailyUsage('user-1', 'messages')).toBe(1);
        expect(await getDailyUsage('user-1', 'emails')).toBe(1);
    });

    it('tracks users independently', async () => {
        await consumeDailyQuota('user-1', 'messages', 5);

        expect(await getDailyUsage('user-2', 'messages')).toBe(0);
    });

    it('reports resetAt as the next UTC midnight', async () => {
        const { resetAt } = await consumeDailyQuota('user-1', 'messages', 5);
        const reset = new Date(resetAt * 1000);

        expect(reset.getUTCHours()).toBe(0);
        expect(reset.getUTCMinutes()).toBe(0);
        expect(resetAt * 1000).toBeGreaterThan(Date.now());
        expect(resetAt * 1000 - Date.now()).toBeLessThanOrEqual(86_400_000);
    });
});

describe('getDailyUsage', () => {
    it('returns 0 with no consumption', async () => {
        expect(await getDailyUsage('user-1', 'messages')).toBe(0);
    });

    it('returns the consumed count', async () => {
        await consumeDailyQuota('user-1', 'messages', 10);
        await consumeDailyQuota('user-1', 'messages', 10);

        expect(await getDailyUsage('user-1', 'messages')).toBe(2);
    });
});

describe('quotaExceededHeaders', () => {
    it('produces retry-after and x-quota headers', async () => {
        const quota = await consumeDailyQuota('user-1', 'messages', 1);
        const headers = quotaExceededHeaders(quota);

        expect(Number(headers['retry-after'])).toBeGreaterThan(0);
        expect(headers['x-quota-limit']).toBe('1');
        expect(headers['x-quota-remaining']).toBe('0');
        expect(headers['x-quota-reset']).toBe(String(quota.resetAt));
    });
});
