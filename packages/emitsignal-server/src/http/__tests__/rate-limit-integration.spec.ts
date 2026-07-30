/**
 * Integration tests for rate limiting in the Elysia lifecycle.
 *
 * These tests verify that consumeLimit works correctly inside a real Elysia
 * beforeHandle hook without mocking the rate-limit module (no module
 * contamination across test files).
 *
 * Endpoint-specific thresholds are covered by the load test script:
 *   bun run scripts/test-rate-limits.ts
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { consumeLimit, SetLike } from '../../http/plugins/rate-limit-plugin';
import { getClientIP, ServerLike } from '../../lib/ip';
import { environment } from '../../schema/environment';

const originalTrustedProxyHeader = environment.TRUSTED_PROXY_HEADER;

beforeAll(() => {
    environment.TRUSTED_PROXY_HEADER = 'x-forwarded-for';
});

afterAll(() => {
    environment.TRUSTED_PROXY_HEADER = originalTrustedProxyHeader;
});

/** Build a minimal Elysia app with a GET /test route guarded by a fresh limiter. */
function makeApp(points: number) {
    const limiter = new RateLimiterMemory({ duration: 3600, points });

    return new Elysia().get('/test', () => ({ ok: true }), {
        beforeHandle: async ({ request, server, set }) => {
            const ip = getClientIP(request, server as ServerLike);
            return consumeLimit(limiter as never, ip, set as SetLike);
        },
    });
}

function req(ip?: string) {
    return new Request('http://localhost/test', {
        headers: ip ? { 'x-forwarded-for': ip } : undefined,
    });
}

// ---------------------------------------------------------------------------
// Core behavior: consumeLimit inside Elysia beforeHandle
// ---------------------------------------------------------------------------
describe('consumeLimit in Elysia beforeHandle', () => {
    it('returns 200 for requests within the limit', async () => {
        const app = makeApp(3);
        for (let i = 0; i < 3; i++) {
            const res = await app.handle(req());
            expect(res.status).toBe(200);
        }
    });

    it('returns 429 once the limit is exceeded', async () => {
        const app = makeApp(2);
        await app.handle(req());
        await app.handle(req());
        const res = await app.handle(req());
        expect(res.status).toBe(429);
    });

    it('response body contains error and retryAfter', async () => {
        const app = makeApp(1);
        await app.handle(req());
        const res = await app.handle(req());
        const body = await res.json();
        expect(body.error).toBe('rate_limit_exceeded');
        expect(body.retryAfter).toBeNumber();
        expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('includes Retry-After header on 429', async () => {
        const app = makeApp(1);
        await app.handle(req());
        const res = await app.handle(req());
        const retryAfter = res.headers.get('retry-after');
        expect(retryAfter).toBeTruthy();
        expect(Number(retryAfter)).toBeGreaterThan(0);
    });

    it('all requests after limit exceeded are 429', async () => {
        const app = makeApp(1);
        await app.handle(req());
        for (let i = 0; i < 3; i++) {
            const res = await app.handle(req());
            expect(res.status).toBe(429);
        }
    });
});

// ---------------------------------------------------------------------------
// Key isolation: different keys have independent counters
// ---------------------------------------------------------------------------
describe('key isolation', () => {
    it('requests from different IPs have independent limits', async () => {
        const app = makeApp(1);
        // Exhaust limit for IP A
        await app.handle(req('1.2.3.4'));
        await app.handle(req('1.2.3.4'));

        // IP B should still be allowed
        const res = await app.handle(req('9.9.9.9'));
        expect(res.status).toBe(200);
    });

    it('X-Forwarded-For is used as the rate limit key', async () => {
        const app = makeApp(1);
        await app.handle(req('203.0.113.1'));

        // Same IP should be blocked
        const blocked = await app.handle(req('203.0.113.1'));
        expect(blocked.status).toBe(429);

        // Different IP is fine
        const allowed = await app.handle(req('203.0.113.2'));
        expect(allowed.status).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// Fail-open: limiter errors don't crash the endpoint
// ---------------------------------------------------------------------------
describe('fail-open behavior', () => {
    it('allows the request through when the limiter throws', async () => {
        const brokenLimiter = {
            consume: async () => {
                throw new Error('Redis down');
            },
        };

        const app = new Elysia().get('/test', () => ({ ok: true }), {
            beforeHandle: async ({ set }) => {
                return consumeLimit(brokenLimiter as never, 'key', set as SetLike);
            },
        });

        const res = await app.handle(req());
        expect(res.status).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// Stateful: beforeEach ensures a fresh limiter per describe block isn't needed
// because makeApp() creates a new limiter instance per call
// ---------------------------------------------------------------------------
describe('statefulness', () => {
    let app: ReturnType<typeof makeApp>;

    beforeEach(() => {
        // Fresh limiter on each test — no state leaks between tests
        app = makeApp(2);
    });

    it('first request is allowed', async () => {
        const res = await app.handle(req());
        expect(res.status).toBe(200);
    });

    it('limit starts fresh — two requests are allowed', async () => {
        await app.handle(req());
        const res = await app.handle(req());
        expect(res.status).toBe(200);
    });

    it('third request is blocked', async () => {
        await app.handle(req());
        await app.handle(req());
        const res = await app.handle(req());
        expect(res.status).toBe(429);
    });
});
