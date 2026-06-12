import { duration } from '../duration';
import { rateLimitRedis } from '../rate-limit';

export interface QuotaResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
}

export type UsageMetric = 'emails' | 'messages';

// Keys expire 25h after first use of the day — an hour past the UTC-midnight
// reset so live reads never see a vanished counter mid-day.
const KEY_TTL_SECONDS = duration.hours(25).as('seconds');

// In test mode counters live in this map instead of Redis.
const testCounters = new Map<string, number>();

export async function consumeDailyQuota(
    userId: string,
    metric: UsageMetric,
    limit: number,
): Promise<QuotaResult> {
    const resetAt = nextUtcMidnight();

    if (Bun.env.NODE_ENV === 'test') {
        const key = usageKey(userId, metric);
        const used = (testCounters.get(key) ?? 0) + 1;

        testCounters.set(key, used);

        return { allowed: used <= limit, limit, remaining: Math.max(0, limit - used), resetAt };
    }

    try {
        const key = usageKey(userId, metric);
        const used = await rateLimitRedis.incr(key);

        if (used === 1) {
            await rateLimitRedis.expire(key, KEY_TTL_SECONDS);
        }

        return { allowed: used <= limit, limit, remaining: Math.max(0, limit - used), resetAt };
    } catch {
        // Redis unavailable — fail open, like the request rate limiters
        return { allowed: true, limit, remaining: limit, resetAt };
    }
}

export async function getDailyUsage(userId: string, metric: UsageMetric): Promise<number> {
    if (Bun.env.NODE_ENV === 'test') {
        return testCounters.get(usageKey(userId, metric)) ?? 0;
    }

    try {
        const raw = await rateLimitRedis.get(usageKey(userId, metric));

        return raw ? Math.max(0, Number.parseInt(raw, 10)) : 0;
    } catch {
        return 0;
    }
}

export function quotaExceededHeaders(quota: QuotaResult): Record<string, string> {
    const nowSeconds = Math.floor(Date.now() / 1000);

    return {
        'retry-after': String(Math.max(1, quota.resetAt - nowSeconds)),
        'x-quota-limit': String(quota.limit),
        'x-quota-remaining': String(quota.remaining),
        'x-quota-reset': String(quota.resetAt),
    };
}

export function resetUsageForTests(): void {
    testCounters.clear();
}

function nextUtcMidnight(): number {
    const now = new Date();
    const reset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);

    return Math.floor(reset / 1000);
}

function usageKey(userId: string, metric: UsageMetric): string {
    const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');

    return `usage:${userId}:${metric}:${day}`;
}
