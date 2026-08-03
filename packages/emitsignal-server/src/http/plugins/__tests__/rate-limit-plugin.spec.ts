import { describe, expect, it } from 'bun:test';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { consumeLimit } from '#/http/plugins/rate-limit-plugin';

describe('consumeLimit', () => {
    it('returns undefined when under limit', async () => {
        const limiter = new RateLimiterMemory({ duration: 60, points: 5 });
        const set: { headers: Record<string, string | undefined> } = { headers: {} };
        const result = await consumeLimit(limiter as never, 'key', set);

        expect(result).toBeUndefined();
        expect(set.headers['retry-after']).toBeUndefined();
    });

    it('returns rate_limit_exceeded error when over limit', async () => {
        const limiter = new RateLimiterMemory({ duration: 60, points: 1 });
        const set = { headers: {} };

        await consumeLimit(limiter as never, 'key', set);

        const result = await consumeLimit(limiter as never, 'key', set);

        expect(result?.error).toBe('rate_limit_exceeded');
        expect(result?.retryAfter).toBeNumber();
        expect(result?.retryAfter).toBeGreaterThan(0);
    });

    it('sets status 429 on the set object when over limit', async () => {
        const limiter = new RateLimiterMemory({ duration: 60, points: 1 });
        const set: { headers: Record<string, string | undefined>; status?: number | string } = {
            headers: {},
        };

        await consumeLimit(limiter as never, 'key', set);
        await consumeLimit(limiter as never, 'key', set);

        expect(set.status).toBe(429);
    });

    it('sets retry-after header when over limit', async () => {
        const limiter = new RateLimiterMemory({ duration: 60, points: 1 });
        const set: { headers: Record<string, string | undefined> } = { headers: {} };

        await consumeLimit(limiter as never, 'key', set);
        await consumeLimit(limiter as never, 'key', set);

        expect(set.headers['retry-after']).toBeString();
        expect(Number(set.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('does not throw on limiter error — fails open', async () => {
        const broken = {
            consume: async () => {
                throw new Error('connection refused');
            },
        };

        const set: { headers: Record<string, string | undefined> } = { headers: {} };

        const result = await consumeLimit(broken as never, 'key', set);

        // Fail-open: allow the request through
        expect(result).toBeUndefined();
        expect(set.headers['retry-after']).toBeUndefined();
    });

    it('tracks limits independently per key', async () => {
        const limiter = new RateLimiterMemory({ duration: 60, points: 1 });
        const setA = { headers: {} };
        const setB = { headers: {} };

        await consumeLimit(limiter as never, 'key-a', setA);

        // key-b has not consumed any points
        const result = await consumeLimit(limiter as never, 'key-b', setB);

        expect(result).toBeUndefined();
    });
});
