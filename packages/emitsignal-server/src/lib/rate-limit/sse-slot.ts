import { duration } from '../duration';
import { rateLimitRedis } from './limiters';

// SSE concurrent-connection slot — returns null if denied, or { release } to call on disconnect.
// Uses incr/decr rather than a windowed limiter because we're counting live connections, not req/s.
export async function acquireSseSlot(
    key: string,
    max: number,
): Promise<{ release: () => Promise<void> } | null> {
    if (Bun.env.NODE_ENV === 'test') {
        return { release: async () => {} };
    }

    try {
        const current = await rateLimitRedis.incr(key);
        // 2-minute TTL so stale slots from crashed/reloaded clients recover quickly.
        await rateLimitRedis.expire(key, duration.minutes(2).as('seconds'));

        if (current > max) {
            await rateLimitRedis.decr(key);

            return null;
        }

        return {
            release: async () => {
                try {
                    await rateLimitRedis.decr(key);
                } catch {
                    // non-fatal — key will expire via TTL
                }
            },
        };
    } catch {
        // Redis unavailable — fail open, connection not tracked
        return { release: async () => {} };
    }
}
