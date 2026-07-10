import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import { APIError } from 'better-auth/api';

import { logger } from '../logger';

// Consume a rate limiter from inside a Better Auth middleware. Unlike the
// Elysia `consumeLimit` in rate-limit-plugin.ts, this raises Better Auth's own
// APIError so the failure is serialized the same way as the rest of the auth
// responses.
//
// Unlike the read/publish limiters, the auth limiters fail CLOSED: if Redis is
// unavailable we reject rather than let OTP send/verify brute-force protection
// silently disappear during an outage.
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

        logger.error({ error, key }, 'auth rate limiter error, failing closed');

        throw new APIError('TOO_MANY_REQUESTS', {
            message: 'Service temporarily unavailable. Please try again later.',
        });
    }
}
