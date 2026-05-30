import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import Elysia from 'elysia';

import { getClientIP, ServerLike } from '../../lib/ip';
import { logger } from '../../lib/logger';
import { globalAnonLimiter, globalAuthLimiter } from '../../lib/rate-limit';
import { resolveUserId } from '../auth/plugin';

export type SetLike = {
    headers: Record<string, number | string | undefined>;
    status?: number | string;
};

export function authAwareBeforeHandle(
    anonLimiter: RateLimiterMemory | RateLimiterRedis,
    authLimiter: RateLimiterMemory | RateLimiterRedis,
) {
    return async ({
        headers,
        request,
        server,
        set,
    }: {
        headers: Record<string, string | undefined>;
        request: Request;
        server: ServerLike;
        set: SetLike;
    }) => {
        const userId = await resolveUserId({ headers });

        const [limiter, key] = userId
            ? [authLimiter, userId]
            : [anonLimiter, getClientIP(request, server)];

        return consumeLimit(limiter, key, set);
    };
}

export async function consumeLimit(
    limiter: RateLimiterMemory | RateLimiterRedis,
    key: string,
    set: SetLike,
): Promise<{ error: string; retryAfter: number } | undefined> {
    try {
        await limiter.consume(key);
    } catch (error) {
        const rl = error as { msBeforeNext?: number };

        if (rl?.msBeforeNext !== undefined) {
            const retryAfter = Math.ceil(rl.msBeforeNext / 1000);

            set.headers['retry-after'] = String(retryAfter);
            set.status = 429;

            return { error: 'rate_limit_exceeded', retryAfter };
        }

        // Redis unavailable — fail open so the server stays up
        logger.error({ error, key }, 'rate limiter error, failing open');
    }
}

export function fixedKeyBeforeHandle<TBody = unknown>(
    limiter: RateLimiterMemory | RateLimiterRedis,
    getKey: (ctx: { body: TBody; request: Request; server: ServerLike }) => string,
) {
    return async ({
        body,
        request,
        server,
        set,
    }: {
        body: TBody;
        request: Request;
        server: ServerLike;
        set: SetLike;
    }) => {
        return consumeLimit(limiter, getKey({ body, request, server }), set);
    };
}

export const rateLimitPlugin = new Elysia({ name: 'rate-limit' })
    .onBeforeHandle(authAwareBeforeHandle(globalAnonLimiter, globalAuthLimiter))
    .as('global');
