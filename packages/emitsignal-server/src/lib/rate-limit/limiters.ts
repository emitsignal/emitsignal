import Redis from 'ioredis';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';
import { duration } from '#/utils/duration';

export const rateLimitRedis = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: 0,
});

rateLimitRedis.on('error', (error: Error) => {
    logger.error({ error }, 'rate limit redis connection error');
});

function makeLimiter(keyPrefix: string, points: number, windowSeconds: number) {
    if (Bun.env.NODE_ENV === 'test') {
        return new RateLimiterMemory({ duration: windowSeconds, keyPrefix, points: points * 1000 });
    }

    return new RateLimiterRedis({
        duration: windowSeconds,
        keyPrefix,
        points,
        storeClient: rateLimitRedis,
    });
}

// Global catch-all — anonymous
export const globalAnonLimiter = makeLimiter(
    'rl:global:anon',
    100,
    duration.minutes(1).as('seconds'),
);

// Global catch-all — authenticated
export const globalAuthLimiter = makeLimiter(
    'rl:global:auth',
    500,
    duration.minutes(1).as('seconds'),
);

// POST /auth/magic-link — keyed by IP+email to block email spam
export const magicLinkLimiter = makeLimiter('rl:magic-link', 3, duration.minutes(15).as('seconds'));

// POST /publish/<topic> — anonymous publisher
export const publishAnonLimiter = makeLimiter(
    'rl:publish:anon',
    10,
    duration.minutes(1).as('seconds'),
);

// POST /publish/<topic> — authenticated publisher
export const publishAuthLimiter = makeLimiter(
    'rl:publish:auth',
    60,
    duration.minutes(1).as('seconds'),
);

// Read endpoints (topics, messages, suggestions) — anonymous
export const readAnonLimiter = makeLimiter('rl:read:anon', 30, duration.minutes(1).as('seconds'));

// Read endpoints — authenticated
export const readAuthLimiter = makeLimiter('rl:read:auth', 120, duration.minutes(1).as('seconds'));

// POST /messages/:id/attachments — anonymous uploader
export const uploadAnonLimiter = makeLimiter('rl:upload:anon', 5, duration.hours(1).as('seconds'));

// POST /messages/:id/attachments — authenticated uploader
export const uploadAuthLimiter = makeLimiter('rl:upload:auth', 20, duration.hours(1).as('seconds'));

// POST /auth/verify — keyed by IP to prevent code brute-force
export const verifyLimiter = makeLimiter('rl:verify', 5, duration.minutes(15).as('seconds'));

// POST /h/:slug — inbound webhook receiver (per slug key)
export const webhookReceiveLimiter = makeLimiter(
    'rl:webhook:recv',
    120,
    duration.minutes(1).as('seconds'),
);
