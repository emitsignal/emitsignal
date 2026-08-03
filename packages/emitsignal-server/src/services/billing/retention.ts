import type { PlanName } from '@emitsignal/shared';

import { PLANS } from '@emitsignal/shared';

import { duration } from '#/utils/duration';

export const ANON_RETENTION_DAYS = 7;
export const ATTACHMENT_MAX_RETENTION_DAYS = 14;

export function attachmentExpiresAt(deliveredAt: Date, retentionDays: number): Date {
    const days =
        retentionDays <= 0
            ? ATTACHMENT_MAX_RETENTION_DAYS
            : Math.min(retentionDays, ATTACHMENT_MAX_RETENTION_DAYS);

    return new Date(deliveredAt.getTime() + duration.days(days).as('ms'));
}

// Expiry for a delivered message. 0 retention days → null (kept forever).
export function messageExpiresAt(deliveredAt: Date, retentionDays: number): Date | null {
    if (retentionDays <= 0) {
        return null;
    }

    return new Date(deliveredAt.getTime() + duration.days(retentionDays).as('ms'));
}

export function messageRetentionDays(plan: null | PlanName): number {
    return plan ? PLANS[plan].limits.retentionDays : ANON_RETENTION_DAYS;
}
