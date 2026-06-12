import { createFileRoute } from '@tanstack/react-router';

import { BillingPage } from '#/components/app/settings/billing-page';

export const Route = createFileRoute('/app/settings/billing')({
    component: BillingPage,
    validateSearch: (search: Record<string, unknown>) => ({
        checkout:
            search.checkout === 'success' || search.checkout === 'cancelled'
                ? search.checkout
                : undefined,
    }),
});
