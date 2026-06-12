import type { PlanName } from '@emitsignal/shared';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { authClient } from '#/lib/auth-client';
import { queryKeys } from '#/lib/query-client';

export type PaidPlanName = Exclude<PlanName, 'free'>;

export function useBilling() {
    const queryClient = useQueryClient();

    const { data, error, isPending } = useQuery({
        queryFn: () => api.getBilling(),
        queryKey: queryKeys.billing,
    });

    const stripeSubscriptionId = data?.subscription?.stripeSubscriptionId ?? undefined;

    const upgradeMutation = useMutation({
        mutationFn: async ({ annual, plan }: { annual: boolean; plan: PaidPlanName }) => {
            // Redirects to Stripe Checkout; passing subscriptionId switches the
            // existing subscription instead of creating a second one.
            const { error: apiError } = await authClient.subscription.upgrade({
                annual,
                cancelUrl: `${billingPageUrl()}?checkout=cancelled`,
                plan,
                subscriptionId: stripeSubscriptionId,
                successUrl: `${billingPageUrl()}?checkout=success`,
            });

            if (apiError) {
                throw new Error(apiError.message ?? 'Could not start checkout');
            }
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async () => {
            // Routes through the Stripe Billing Portal cancellation flow
            const { error: apiError } = await authClient.subscription.cancel({
                returnUrl: billingPageUrl(),
                subscriptionId: stripeSubscriptionId,
            });

            if (apiError) {
                throw new Error(apiError.message ?? 'Could not open the cancellation flow');
            }
        },
    });

    const restoreMutation = useMutation({
        mutationFn: async () => {
            const { error: apiError } = await authClient.subscription.restore({
                subscriptionId: stripeSubscriptionId,
            });

            if (apiError) {
                throw new Error(apiError.message ?? 'Could not restore the subscription');
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.billing });
        },
    });

    const portalMutation = useMutation({
        mutationFn: async () => {
            const { data: portal, error: apiError } = await authClient.subscription.billingPortal({
                returnUrl: billingPageUrl(),
            });

            if (apiError) {
                throw new Error(apiError.message ?? 'Could not open the billing portal');
            }

            if (portal?.url) {
                window.location.href = portal.url;
            }
        },
    });

    const mutationError =
        upgradeMutation.error ??
        cancelMutation.error ??
        restoreMutation.error ??
        portalMutation.error;

    return {
        billing: data ?? null,
        busy:
            upgradeMutation.isPending ||
            cancelMutation.isPending ||
            restoreMutation.isPending ||
            portalMutation.isPending,
        cancel: () => cancelMutation.mutateAsync(),
        error:
            error instanceof Error
                ? error.message
                : mutationError instanceof Error
                  ? mutationError.message
                  : null,
        loading: isPending,
        openBillingPortal: () => portalMutation.mutateAsync(),
        refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.billing }),
        restore: () => restoreMutation.mutateAsync(),
        upgrade: (plan: PaidPlanName, annual: boolean) =>
            upgradeMutation.mutateAsync({ annual, plan }),
    };
}

function billingPageUrl(): string {
    return `${window.location.origin}/app/settings/billing`;
}
