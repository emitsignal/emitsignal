import { APIError } from 'better-auth/api';
import { describe, expect, it } from 'bun:test';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { enforceAuthRateLimit } from './enforce';

describe('enforceAuthRateLimit', () => {
    it('allows requests up to the limit and rejects the next with TOO_MANY_REQUESTS', async () => {
        const limiter = new RateLimiterMemory({ duration: 900, points: 3 });

        await enforceAuthRateLimit(limiter, 'key');
        await enforceAuthRateLimit(limiter, 'key');
        await enforceAuthRateLimit(limiter, 'key');

        let thrown: unknown;

        try {
            await enforceAuthRateLimit(limiter, 'key');
        } catch (error) {
            thrown = error;
        }

        expect(thrown).toBeInstanceOf(APIError);
        expect((thrown as APIError).status).toBe('TOO_MANY_REQUESTS');
    });

    it('tracks limits independently per key', async () => {
        const limiter = new RateLimiterMemory({ duration: 900, points: 1 });

        await enforceAuthRateLimit(limiter, 'first');

        // A different key still has budget even though 'first' is exhausted.
        await expect(enforceAuthRateLimit(limiter, 'second')).resolves.toBeUndefined();
    });

    it('fails closed when the limiter errors without rate-limit info', async () => {
        const brokenLimiter = {
            consume: async () => {
                throw new Error('redis unavailable');
            },
        } as unknown as RateLimiterMemory;

        let thrown: unknown;

        try {
            await enforceAuthRateLimit(brokenLimiter, 'key');
        } catch (error) {
            thrown = error;
        }

        expect(thrown).toBeInstanceOf(APIError);
        expect((thrown as APIError).status).toBe('TOO_MANY_REQUESTS');
    });
});
