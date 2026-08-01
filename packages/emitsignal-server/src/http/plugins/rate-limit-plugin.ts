import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import * as Sentry from '@sentry/bun';
import Elysia from 'elysia';

import { getClientIP, ServerLike } from '../../lib/ip';
import { logger } from '../../lib/logger';
import { globalAnonLimiter, globalAuthLimiter } from '../../lib/rate-limit';
import { resolveUserId } from '../auth/plugin';

const LIMITER_UNAVAILABLE_RETRY_SECONDS = 30;

// A limiter outage fails every request, so reporting per-request would emit
// thousands of identical events and burn the Sentry quota during the exact
// incident the alert is for. One event per window is enough to page someone.
const LIMITER_ERROR_REPORT_INTERVAL_MS = 60_000;

let lastLimiterErrorReportedAt = 0;

export interface ConsumeLimitOptions {
    // reject rather than allow when the limiter backend is
    // unreachable. Set this on anonymous write paths, where the rate limiter is
    // the ONLY control standing between the public internet and the database.
    failClosed?: boolean;
}

export type SetLike = {
    headers: Record<string, number | string | undefined>;
    status?: number | string;
};

export function authAwareBeforeHandle(
    anonLimiter: RateLimiterMemory | RateLimiterRedis,
    authLimiter: RateLimiterMemory | RateLimiterRedis,
    options: { failClosedWhenAnonymous?: boolean } = {},
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

        return consumeLimit(limiter, key, set, {
            failClosed: !userId && options.failClosedWhenAnonymous === true,
        });
    };
}

export async function consumeLimit(
    limiter: RateLimiterMemory | RateLimiterRedis,
    key: string,
    set: SetLike,
    options: ConsumeLimitOptions = {},
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

        // a limiter outage used to be logged and then silently ignored
        // on every route. Surface it as an exception so it actually pages someone,
        // instead of only landing in a log nobody is watching.
        logger.error({ error, failClosed: options.failClosed === true, key }, 'rate limiter error');
        reportLimiterError(error);

        if (options.failClosed) {
            set.headers['retry-after'] = String(LIMITER_UNAVAILABLE_RETRY_SECONDS);
            set.status = 503;

            return {
                error: 'rate_limiter_unavailable',
                retryAfter: LIMITER_UNAVAILABLE_RETRY_SECONDS,
            };
        }
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

function reportLimiterError(error: unknown): void {
    const now = Date.now();

    if (now - lastLimiterErrorReportedAt < LIMITER_ERROR_REPORT_INTERVAL_MS) {
        return;
    }

    lastLimiterErrorReportedAt = now;

    Sentry.captureException(error, { tags: { component: 'rate-limiter' } });
}

export const rateLimitPlugin = new Elysia({ name: 'rate-limit' })
    .onBeforeHandle(authAwareBeforeHandle(globalAnonLimiter, globalAuthLimiter))
    .as('global');
