import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import { APIError } from 'better-auth/api';

import { logger } from '../logger';

// Consume a rate limiter from inside a Better Auth middleware. Unlike the
// Elysia `consumeLimit` in rate-limit-plugin.ts, this raises Better Auth's own
// APIError so the failure is serialized the same way as the rest of the auth
// responses. Redis errors fail open, matching the project's rate-limit policy.
export async function enforceAuthRateLimit(
    limiter: RateLimiterMemory | RateLimiterRedis,
    key: string,
): Promise<void> {
    try {
        await limiter.consume(key);
    } catch (error) {
        const rateLimit = error as { msBeforeNext?: number };

        if (rateLimit?.msBeforeNext !== undefined) {
            throw new APIError('TOO_MANY_REQUESTS', {
                message: 'Too many requests. Please try again later.',
            });
        }

        logger.error({ error, key }, 'auth rate limiter error, failing open');
    }
}
