import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import {
    getUserLimits,
    getUserPlan,
    invalidateUserPlanCache,
    resetUserPlansForTests,
    setUserPlanForTests,
} from './get-user-plan';
import { PLANS } from './plans';

function subscriptionRow(overrides: Record<string, unknown> = {}) {
    return {
        cancelAtPeriodEnd: false,
        id: 'plan-sub-1',
        periodEnd: new Date(Date.now() + 86_400_000),
        plan: 'pulse',
        referenceId: 'user-1',
        status: 'active',
        stripeSubscriptionId: 'sub_123',
        ...overrides,
    };
}

beforeEach(() => {
    resetUserPlansForTests();
    prismaMock.planSubscription.findFirst.mockReset();
    prismaMock.planSubscription.findFirst.mockResolvedValue(null);
});

describe('getUserPlan', () => {
    it('returns free when there is no subscription row', async () => {
        expect(await getUserPlan('user-1')).toBe('free');
    });

    it('returns the plan of an active subscription', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(subscriptionRow());

        expect(await getUserPlan('user-1')).toBe('pulse');
    });

    it('returns beam for an active beam subscription', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(subscriptionRow({ plan: 'beam' }));

        expect(await getUserPlan('user-1')).toBe('beam');
    });

    it('falls back to free when periodEnd is more than 24h in the past', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(
            subscriptionRow({ periodEnd: new Date(Date.now() - 2 * 86_400_000) }),
        );

        expect(await getUserPlan('user-1')).toBe('free');
    });

    it('keeps the plan within the 24h grace window after periodEnd', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(
            subscriptionRow({ periodEnd: new Date(Date.now() - 3_600_000) }),
        );

        expect(await getUserPlan('user-1')).toBe('pulse');
    });

    it('falls back to free for an unknown plan name', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(
            subscriptionRow({ plan: 'enterprise' }),
        );

        expect(await getUserPlan('user-1')).toBe('free');
    });

    it('only considers active and trialing subscriptions', async () => {
        await getUserPlan('user-1');

        expect(prismaMock.planSubscription.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    referenceId: 'user-1',
                    status: { in: ['active', 'trialing'] },
                }),
            }),
        );
    });
});

describe('test overrides', () => {
    it('setUserPlanForTests takes precedence over the database', async () => {
        prismaMock.planSubscription.findFirst.mockResolvedValue(subscriptionRow());
        setUserPlanForTests('user-1', 'beam');

        expect(await getUserPlan('user-1')).toBe('beam');
    });

    it('invalidateUserPlanCache clears the override', async () => {
        setUserPlanForTests('user-1', 'beam');
        await invalidateUserPlanCache('user-1');

        expect(await getUserPlan('user-1')).toBe('free');
    });
});

describe('getUserLimits', () => {
    it('returns the limits of the resolved plan', async () => {
        setUserPlanForTests('user-1', 'pulse');

        expect(await getUserLimits('user-1')).toEqual(PLANS.pulse.limits);
    });

    it('returns free limits by default', async () => {
        expect(await getUserLimits('user-2')).toEqual(PLANS.free.limits);
    });
});
