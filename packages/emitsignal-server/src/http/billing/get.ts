import type { BillingInfo, PlanSubscriptionInfo } from '@emitsignal/shared';

import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/resolve-user-id';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { prisma } from '#/lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { isStripeBillingEnabled, PLANS } from '#/services/billing/plans';
import { getDailyUsage } from '#/services/billing/usage';

export const getBilling = new Elysia().get(
    '/billing',
    async ({ headers, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

        const plan = await getUserPlan(userId);

        const [emailsToday, messagesToday, ownedTopics, webhooks, subscriptionRow] =
            await Promise.all([
                getDailyUsage(userId, 'emails'),
                getDailyUsage(userId, 'messages'),
                prisma.topic.count({ where: { ownerId: userId } }),
                prisma.webhook.count({ where: { userId } }),
                prisma.planSubscription.findFirst({
                    orderBy: { periodEnd: 'desc' },
                    where: { referenceId: userId, status: { in: ['active', 'trialing'] } },
                }),
            ]);

        const subscription: null | PlanSubscriptionInfo = subscriptionRow
            ? {
                  cancelAtPeriodEnd: subscriptionRow.cancelAtPeriodEnd ?? false,
                  interval:
                      subscriptionRow.billingInterval === 'month' ||
                      subscriptionRow.billingInterval === 'year'
                          ? subscriptionRow.billingInterval
                          : null,
                  periodEnd: subscriptionRow.periodEnd
                      ? Math.floor(subscriptionRow.periodEnd.getTime() / 1000)
                      : null,
                  status: subscriptionRow.status,
                  stripeSubscriptionId: subscriptionRow.stripeSubscriptionId,
              }
            : null;

        const billing: BillingInfo = {
            billingEnabled: isStripeBillingEnabled(),
            limits: PLANS[plan].limits,
            plan,
            subscription,
            usage: { emailsToday, messagesToday, ownedTopics, webhooks },
        };

        return billing;
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
    },
);
