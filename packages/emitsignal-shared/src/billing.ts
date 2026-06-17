export interface BillingInfo {
    billingEnabled: boolean;
    limits: PlanLimits;
    plan: PlanName;
    subscription: null | PlanSubscriptionInfo;
    usage: BillingUsage;
}

export interface BillingUsage {
    emailsToday: number;
    messagesToday: number;
    ownedTopics: number;
    webhooks: number;
}

export interface PlanDefinition {
    description: string;
    label: string;
    limits: PlanLimits;
    name: PlanName;
    priceMonthlyUsd: number;
    priceYearlyUsd: number;
}

export interface PlanLimits {
    attachmentMaxBytes: number;
    emailsPerDay: number;
    inlineMaxPerArray: number;
    maxOwnedTopics: number;
    maxWebhooks: number;
    messagesPerDay: number;
}

export type PlanName = 'beam' | 'free' | 'pulse';

export interface PlanSubscriptionInfo {
    cancelAtPeriodEnd: boolean;
    interval: 'month' | 'year' | null;
    periodEnd: null | number;
    status: string;
    stripeSubscriptionId: null | string;
}

const MEGABYTE = 1024 * 1024;

export const PLANS: Record<PlanName, PlanDefinition> = {
    beam: {
        description: 'High-volume signals for products and teams that depend on them.',
        label: 'Beam',
        limits: {
            attachmentMaxBytes: 100 * MEGABYTE,
            emailsPerDay: 250,
            inlineMaxPerArray: 15,
            maxOwnedTopics: 50,
            maxWebhooks: 30,
            messagesPerDay: 20_000,
        },
        name: 'beam',
        priceMonthlyUsd: 12,
        priceYearlyUsd: 120,
    },
    free: {
        description: 'Everything you need to start emitting signals.',
        label: 'Free',
        limits: {
            attachmentMaxBytes: 5 * MEGABYTE,
            emailsPerDay: 5,
            inlineMaxPerArray: 3,
            maxOwnedTopics: 5,
            maxWebhooks: 2,
            messagesPerDay: 100,
        },
        name: 'free',
        priceMonthlyUsd: 0,
        priceYearlyUsd: 0,
    },
    pulse: {
        description: 'More room for side projects, homelabs and busy bots.',
        label: 'Pulse',
        limits: {
            attachmentMaxBytes: 25 * MEGABYTE,
            emailsPerDay: 50,
            inlineMaxPerArray: 5,
            maxOwnedTopics: 15,
            maxWebhooks: 10,
            messagesPerDay: 2500,
        },
        name: 'pulse',
        priceMonthlyUsd: 5,
        priceYearlyUsd: 50,
    },
};

export const PLAN_ORDER: PlanName[] = ['free', 'pulse', 'beam'];

export const PAID_PLAN_NAMES: PlanName[] = ['pulse', 'beam'];

export function isPlanName(value: string): value is PlanName {
    return value in PLANS;
}
