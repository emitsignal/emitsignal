import { logger } from '#/lib/logger';
import { redis } from '#/lib/redis';
import { duration } from '#/utils/duration';

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

        if (used > limit) {
            return { allowed: false, limit, remaining: 0, resetAt };
        }

        testCounters.set(key, used);

        return { allowed: true, limit, remaining: limit - used, resetAt };
    }

    try {
        const key = usageKey(userId, metric);
        const used = await redis.incr(key);

        if (used === 1) {
            await redis.expire(key, KEY_TTL_SECONDS);
        }

        if (used > limit) {
            await redis.decr(key);

            return { allowed: false, limit, remaining: 0, resetAt };
        }

        return { allowed: true, limit, remaining: limit - used, resetAt };
    } catch (error) {
        logger.error({ error, metric }, 'daily quota check failed, allowing request');

        return { allowed: true, limit, remaining: limit, resetAt };
    }
}

export async function getDailyUsage(userId: string, metric: UsageMetric): Promise<number> {
    if (Bun.env.NODE_ENV === 'test') {
        return testCounters.get(usageKey(userId, metric)) ?? 0;
    }

    try {
        const raw = await redis.get(usageKey(userId, metric));

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

export async function refundDailyQuota(userId: string, metric: UsageMetric): Promise<void> {
    const key = usageKey(userId, metric);

    if (Bun.env.NODE_ENV === 'test') {
        testCounters.set(key, Math.max(0, (testCounters.get(key) ?? 0) - 1));

        return;
    }

    try {
        const used = await redis.decr(key);

        if (used < 0) {
            await redis.set(key, '0');
        }
    } catch (error) {
        logger.error({ error, metric }, 'daily quota refund failed');
    }
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
