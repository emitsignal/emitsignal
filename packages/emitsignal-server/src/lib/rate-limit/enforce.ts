import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import { APIError } from 'better-auth/api';

import { logger } from '#/lib/logger';

export async function enforceAuthRateLimit(
    limiter: RateLimiterMemory | RateLimiterRedis,
    key: string,
): Promise<void> {
    try {
        await limiter.consume(key);
    } catch (error) {
        const rateLimit = error as { msBeforeNext?: number };

        if (rateLimit?.msBeforeNext !== undefined) {
            logger.warn({ limiter: limiter.keyPrefix }, 'auth rate limit exceeded');

            throw new APIError('TOO_MANY_REQUESTS', {
                message: 'Too many requests. Please try again later.',
            });
        }

        logger.error(
            { error, limiter: limiter.keyPrefix },
            'auth rate limiter error, failing closed',
        );

        throw new APIError('TOO_MANY_REQUESTS', {
            message: 'Service temporarily unavailable. Please try again later.',
        });
    }
}
