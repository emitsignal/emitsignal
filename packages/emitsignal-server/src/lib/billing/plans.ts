import type { PlanLimits, PlanName } from '@emitsignal/shared';

import { PLANS } from '@emitsignal/shared';

import { environment } from '#/schema/environment';

export { PLAN_ORDER, PLANS } from '@emitsignal/shared';
export type { PlanDefinition, PlanLimits, PlanName } from '@emitsignal/shared';

interface StripePlanConfig {
    annualDiscountPriceId: string;
    limits: Record<string, number>;
    name: PlanName;
    priceId: string;
}

export class PlanLimitError extends Error {
    readonly limit: number;
    readonly metric: 'emails' | 'owned_topics' | 'webhooks';
    readonly plan: PlanName;

    constructor(metric: 'emails' | 'owned_topics' | 'webhooks', plan: PlanName, limit: number) {
        super(`Plan limit reached: ${metric} (${limit}) on plan ${plan}`);
        this.limit = limit;
        this.metric = metric;
        this.plan = plan;
    }
}

export function isStripeBillingEnabled(): boolean {
    return Boolean(
        environment.STRIPE_PRICE_BEAM_MONTHLY &&
        environment.STRIPE_PRICE_BEAM_YEARLY &&
        environment.STRIPE_PRICE_PULSE_MONTHLY &&
        environment.STRIPE_PRICE_PULSE_YEARLY &&
        environment.STRIPE_SECRET_KEY &&
        environment.STRIPE_WEBHOOK_SECRET,
    );
}

// Plans handed to the @better-auth/stripe plugin. The free plan is intentionally
// absent — no PlanSubscription row means free.
export function stripePlanConfig(): StripePlanConfig[] {
    return [
        {
            annualDiscountPriceId: environment.STRIPE_PRICE_PULSE_YEARLY as string,
            limits: toPluginLimits(PLANS.pulse.limits),
            name: 'pulse',
            priceId: environment.STRIPE_PRICE_PULSE_MONTHLY as string,
        },
        {
            annualDiscountPriceId: environment.STRIPE_PRICE_BEAM_YEARLY as string,
            limits: toPluginLimits(PLANS.beam.limits),
            name: 'beam',
            priceId: environment.STRIPE_PRICE_BEAM_MONTHLY as string,
        },
    ];
}

function toPluginLimits(limits: PlanLimits): Record<string, number> {
    return { ...limits };
}
