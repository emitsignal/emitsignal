import Redis from 'ioredis';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import { duration } from '#/lib/duration';
import { environment } from '#/schema/environment';

// Dedicated connection with maxRetriesPerRequest: 0 so that consume() fails
// immediately when Redis is unavailable instead of blocking indefinitely.
// consumeLimit() catches the error and fails-open, keeping the server alive.
export const rateLimitRedis = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: 0,
});

// In test mode use in-memory limiters with large points so unit/integration tests
// that don't explicitly mock this module never hit a rate limit by accident.
// Bun sets Bun.env.NODE_ENV = 'test' automatically during `bun test` runs.
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

// POST /topic/:name — anonymous publisher
export const publishAnonLimiter = makeLimiter(
    'rl:publish:anon',
    10,
    duration.minutes(1).as('seconds'),
);

// POST /topic/:name — authenticated publisher
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
