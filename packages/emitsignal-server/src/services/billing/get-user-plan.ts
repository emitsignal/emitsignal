import type { PlanLimits, PlanName } from '@emitsignal/shared';

import { isPlanName, PLANS } from '@emitsignal/shared';

import { prisma } from '#/lib/prisma';
import { redis } from '#/lib/redis';
import { duration } from '#/utils/duration';

const PLAN_CACHE_TTL_SECONDS = 60;

// Statuses that grant access to a paid plan. Webhooks keep these in sync;
// anything else (past_due, canceled, incomplete...) falls back to free.
const ACTIVE_STATUSES = ['active', 'trialing'];

// Grace window for webhook lag: a subscription whose period ended more than
// this long ago is treated as expired even if the status row is stale.
const PERIOD_END_GRACE_MS = duration.hours(24).as('ms');

// In test mode this map overrides plan resolution; misses fall through to the
// (mocked) database so resolution logic itself stays unit-testable.
const testPlanCache = new Map<string, PlanName>();

export async function getUserLimits(userId: string): Promise<PlanLimits> {
    return PLANS[await getUserPlan(userId)].limits;
}

export async function getUserPlan(userId: string): Promise<PlanName> {
    if (Bun.env.NODE_ENV === 'test') {
        const override = testPlanCache.get(userId);

        if (override) {
            return override;
        }

        return resolvePlanFromDatabase(userId);
    }

    try {
        const cached = await redis.get(cacheKey(userId));

        if (cached && isPlanName(cached)) {
            return cached;
        }
    } catch {
        // Redis unavailable — fall through to the database
    }

    const plan = await resolvePlanFromDatabase(userId);

    try {
        await redis.setex(cacheKey(userId), PLAN_CACHE_TTL_SECONDS, plan);
    } catch {
        // Redis unavailable — skip caching
    }

    return plan;
}

export async function invalidateUserPlanCache(userId: string): Promise<void> {
    if (Bun.env.NODE_ENV === 'test') {
        testPlanCache.delete(userId);

        return;
    }

    try {
        await redis.del(cacheKey(userId));
    } catch {
        // non-fatal — the key expires via TTL
    }
}

export function resetUserPlansForTests(): void {
    testPlanCache.clear();
}

export function setUserPlanForTests(userId: string, plan: PlanName): void {
    testPlanCache.set(userId, plan);
}

function cacheKey(userId: string): string {
    return `billing:plan:${userId}`;
}

async function resolvePlanFromDatabase(userId: string): Promise<PlanName> {
    const subscription = await prisma.planSubscription.findFirst({
        orderBy: { periodEnd: 'desc' },
        where: { referenceId: userId, status: { in: ACTIVE_STATUSES } },
    });

    if (!subscription) {
        return 'free';
    }

    if (
        subscription.periodEnd &&
        subscription.periodEnd.getTime() < Date.now() - PERIOD_END_GRACE_MS
    ) {
        return 'free';
    }

    if (isPlanName(subscription.plan)) {
        return subscription.plan;
    }

    return 'free';
}
