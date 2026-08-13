import type { Queue } from 'bullmq';

import type { EmailOptions } from '#/lib/email/provider';

import { captureTraceContext, Traced } from '#/lib/trace-context';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { PlanLimitError, PLANS } from '#/services/billing/plans';
import { consumeDailyQuota } from '#/services/billing/usage';

export interface EmailQuotaOptions {
    userId: string;
}

export class EmailService {
    private static queue: Queue<Traced<EmailOptions>>;

    static init(queue: Queue<Traced<EmailOptions>>): void {
        EmailService.queue = queue;
    }

    // Pass `quota` for user-triggered emails so they count against the sender's
    // daily plan quota. System emails (magic links) omit it and are never blocked.
    static async send(options: EmailOptions, quota?: EmailQuotaOptions): Promise<void> {
        if (quota) {
            const plan = await getUserPlan(quota.userId);
            const limit = PLANS[plan].limits.emailsPerDay;
            const result = await consumeDailyQuota(quota.userId, 'emails', limit);

            if (!result.allowed) {
                throw new PlanLimitError('emails', plan, limit);
            }
        }

        await EmailService.queue.add('send-email', {
            ...options,
            traceContext: captureTraceContext(),
        });
    }
}
