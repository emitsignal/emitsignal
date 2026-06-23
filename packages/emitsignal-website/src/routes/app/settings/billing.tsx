import { isPlanName } from '@emitsignal/shared/billing';
import { createFileRoute } from '@tanstack/react-router';

import { BillingPage } from '#/components/app/settings/billing-page';

type CheckoutStatus = 'cancelled' | 'success' | 'updated';

function isCheckoutStatus(value: unknown): value is CheckoutStatus {
    return value === 'success' || value === 'cancelled' || value === 'updated';
}

export const Route = createFileRoute('/app/settings/billing')({
    component: BillingPage,
    validateSearch: (search: Record<string, unknown>) => ({
        checkout: isCheckoutStatus(search.checkout) ? search.checkout : undefined,
        interval:
            search.interval === 'month' || search.interval === 'year' ? search.interval : undefined,
        plan: typeof search.plan === 'string' && isPlanName(search.plan) ? search.plan : undefined,
    }),
});
