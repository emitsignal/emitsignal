import { duration } from '#/utils/duration';

import { rateLimitRedis } from './limiters';

const SLOT_TTL_SECONDS = duration.minutes(2).as('seconds');

export interface SseSlot {
    // Re-arm the TTL. Called on each heartbeat so the counter never expires
    // while the connection is still open (otherwise the cap stops enforcing and
    // a later release drives the counter negative).
    refresh: () => Promise<void>;
    // Give the slot back. Idempotent: safe to call from both the abort handler
    // and a heartbeat failure without double-decrementing.
    release: () => Promise<void>;
}

// SSE concurrent-connection slot — returns null if denied, or an SseSlot to
// refresh/release. Uses incr/decr rather than a windowed limiter because we're
// counting live connections, not req/s.
export async function acquireSseSlot(key: string, max: number): Promise<null | SseSlot> {
    const noop: SseSlot = { refresh: async () => {}, release: async () => {} };

    if (Bun.env.NODE_ENV === 'test') {
        return noop;
    }

    try {
        const current = await rateLimitRedis.incr(key);
        await rateLimitRedis.expire(key, SLOT_TTL_SECONDS);

        if (current > max) {
            await rateLimitRedis.decr(key);

            return null;
        }

        let released = false;

        return {
            refresh: async () => {
                try {
                    await rateLimitRedis.expire(key, SLOT_TTL_SECONDS);
                } catch {
                    // non-fatal — a missed refresh only shortens the TTL window
                }
            },
            release: async () => {
                if (released) {
                    return;
                }

                released = true;

                try {
                    await rateLimitRedis.decr(key);
                } catch {
                    // non-fatal — key will expire via TTL
                }
            },
        };
    } catch {
        // Redis unavailable — fail open, connection not tracked
        return noop;
    }
}
