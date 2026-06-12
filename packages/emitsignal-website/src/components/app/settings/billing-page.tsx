import type { PlanDefinition } from '@emitsignal/shared/billing';

import { PLAN_ORDER, PLANS } from '@emitsignal/shared/billing';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Check, Clock, CreditCard, RotateCcw, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { PaidPlanName } from '#/hooks/use-billing';

import { useBilling } from '#/hooks/use-billing';
import { queryKeys } from '#/lib/query-client';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsPill } from './settings-pill';
import { UsageBar } from './usage-bar';

const USAGE_RESET_HINT = 'Daily counters reset at midnight UTC';

interface PlanActionProps {
    busy: boolean;
    currentInterval: 'month' | 'year' | null;
    currentPlan: string;
    isCurrent: boolean;
    onCancel: () => void;
    onUpgrade: (plan: PaidPlanName) => void;
    planName: string;
    yearly: boolean;
}

export function BillingPage() {
    const { billing, busy, cancel, error, loading, openBillingPortal, restore, upgrade } =
        useBilling();
    const queryClient = useQueryClient();
    const navigate = useNavigate({ from: '/app/settings/billing' });
    const { checkout } = useSearch({ from: '/app/settings/billing' });
    const [yearly, setYearly] = useState(false);

    useEffect(() => {
        if (!checkout) {
            return;
        }

        if (checkout === 'success') {
            void queryClient.invalidateQueries({ queryKey: queryKeys.billing });
        }

        void navigate({ replace: true, search: { checkout: undefined } });
    }, [checkout, navigate, queryClient]);

    useEffect(() => {
        if (billing?.subscription?.interval === 'year') {
            setYearly(true);
        }
    }, [billing?.subscription?.interval]);

    if (loading) {
        return (
            <>
                <PageHeader />
                <SettingsCard>
                    <div className="py-6 text-center font-mono text-[12px] text-dim">
                        Loading billing…
                    </div>
                </SettingsCard>
            </>
        );
    }

    if (!billing) {
        return (
            <>
                <PageHeader />
                <SettingsCard>
                    <div className="py-6 text-center font-mono text-[12px] text-danger">
                        {error ?? 'Could not load billing information.'}
                    </div>
                </SettingsCard>
            </>
        );
    }

    const currentPlan = PLANS[billing.plan];
    const subscription = billing.subscription;
    const isPaid = billing.plan !== 'free';
    const interval = subscription?.interval ?? null;

    return (
        <>
            <PageHeader />

            {checkout === 'success' ? (
                <div className="mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-success/40 bg-success/5 px-4 py-3 text-[12.5px] text-success">
                    <Check size={14} />
                    Subscription updated — welcome to {currentPlan.label}!
                </div>
            ) : null}

            {error ? (
                <div className="mb-[18px] rounded-[10px] border border-danger/40 bg-danger/5 px-4 py-3 text-[12.5px] text-danger">
                    {error}
                </div>
            ) : null}

            <div>
                <SettingsCard
                    className="border-accent/30"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0.02) 100%)',
                    }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2.5">
                                <span className="text-[19px] font-bold tracking-[-0.4px]">
                                    {currentPlan.label}
                                </span>
                                <SettingsPill tone="accent-solid">CURRENT</SettingsPill>
                                {interval ? (
                                    <SettingsPill tone="success">
                                        {interval === 'year' ? 'YEARLY' : 'MONTHLY'}
                                    </SettingsPill>
                                ) : null}
                                {subscription?.cancelAtPeriodEnd ? (
                                    <SettingsPill tone="warn">CANCELS AT PERIOD END</SettingsPill>
                                ) : null}
                            </div>
                            <p className="text-[13px] leading-[1.55] text-muted">
                                {currentPlan.description}
                            </p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                            <div className="font-mono text-[30px] font-semibold tracking-[-1px]">
                                $
                                {interval === 'year'
                                    ? currentPlan.priceYearlyUsd
                                    : currentPlan.priceMonthlyUsd}
                            </div>
                            <div className="font-mono text-[11px] text-dim">
                                {interval === 'year' ? '/ yr' : '/ mo'}
                            </div>
                        </div>
                    </div>

                    {isPaid && subscription ? (
                        <div className="mt-[18px] flex flex-wrap items-center gap-3 border-t border-line pt-4">
                            <Clock className="shrink-0 text-dim" size={13} />
                            <span className="font-mono text-[11.5px] text-muted">
                                {subscription.periodEnd
                                    ? `${subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${formatDate(subscription.periodEnd)}`
                                    : `Status: ${subscription.status}`}
                            </span>
                            <div className="flex flex-wrap gap-2.5 sm:ml-auto">
                                {subscription.cancelAtPeriodEnd ? (
                                    <SettingsButton
                                        disabled={busy}
                                        icon={RotateCcw}
                                        onClick={() => void restore()}
                                        variant="primary"
                                    >
                                        Restore subscription
                                    </SettingsButton>
                                ) : null}
                                <SettingsButton
                                    disabled={busy}
                                    icon={CreditCard}
                                    onClick={() => void openBillingPortal()}
                                    variant="ghost"
                                >
                                    Manage billing
                                </SettingsButton>
                            </div>
                        </div>
                    ) : null}
                </SettingsCard>

                <SettingsCard description={USAGE_RESET_HINT} title="Usage today">
                    <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
                        <div>
                            <div className="mb-3 text-[12.5px] font-medium">Messages today</div>
                            <UsageBar
                                color="var(--color-accent)"
                                total={billing.limits.messagesPerDay}
                                used={billing.usage.messagesToday}
                            />
                        </div>
                        <div>
                            <div className="mb-3 text-[12.5px] font-medium">Emails today</div>
                            <UsageBar
                                color="var(--color-info)"
                                total={billing.limits.emailsPerDay}
                                used={billing.usage.emailsToday}
                            />
                        </div>
                        <div>
                            <div className="mb-3 text-[12.5px] font-medium">Owned topics</div>
                            <UsageBar
                                color="var(--color-pink)"
                                total={billing.limits.maxOwnedTopics}
                                used={billing.usage.ownedTopics}
                            />
                        </div>
                        <div>
                            <div className="mb-3 text-[12.5px] font-medium">Webhooks</div>
                            <UsageBar
                                color="var(--color-success)"
                                total={billing.limits.maxWebhooks}
                                used={billing.usage.webhooks}
                            />
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard
                    action={
                        <div className="flex items-center gap-1 rounded-full border border-line bg-bg p-[3px] font-mono text-[11px]">
                            <button
                                className={`cursor-pointer rounded-full px-2.5 py-1 ${yearly ? 'text-dim' : 'bg-accent font-semibold text-bg'}`}
                                onClick={() => setYearly(false)}
                                type="button"
                            >
                                Monthly
                            </button>
                            <button
                                className={`cursor-pointer rounded-full px-2.5 py-1 ${yearly ? 'bg-accent font-semibold text-bg' : 'text-dim'}`}
                                onClick={() => setYearly(true)}
                                type="button"
                            >
                                Yearly · 2 months free
                            </button>
                        </div>
                    }
                    description="Upgrades apply immediately and are prorated. Downgrades take effect next cycle."
                    title="Change plan"
                >
                    {billing.billingEnabled ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {PLAN_ORDER.map((planName) => {
                                const tier = PLANS[planName];
                                const isCurrent = planName === billing.plan;

                                return (
                                    <div
                                        className={`rounded-[9px] border p-4 ${
                                            isCurrent
                                                ? 'border-accent bg-accent/10'
                                                : 'border-line bg-bg'
                                        }`}
                                        key={planName}
                                    >
                                        <div className="mb-1 flex items-center justify-between">
                                            <span
                                                className={`text-[14px] font-bold ${isCurrent ? 'text-accent' : 'text-fg'}`}
                                            >
                                                {tier.label}
                                            </span>
                                            {isCurrent ? (
                                                <SettingsPill tone="accent-solid">ON</SettingsPill>
                                            ) : null}
                                        </div>
                                        <div className="mb-3 font-mono text-[10px] text-dim">
                                            {tier.description}
                                        </div>
                                        <div className="mb-3.5">
                                            <span className="font-mono text-[22px] font-semibold">
                                                $
                                                {yearly
                                                    ? tier.priceYearlyUsd
                                                    : tier.priceMonthlyUsd}
                                            </span>
                                            <span className="font-mono text-[10px] text-dim">
                                                {' '}
                                                /{yearly ? 'yr' : 'mo'}
                                            </span>
                                        </div>
                                        <div className="mb-4 flex flex-col gap-[7px]">
                                            {planFeatures(tier).map((feature) => (
                                                <div
                                                    className="flex items-center gap-2 text-[11.5px] text-muted"
                                                    key={feature}
                                                >
                                                    <Check
                                                        className={`shrink-0 ${isCurrent ? 'text-accent' : 'text-success'}`}
                                                        size={11}
                                                    />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                        <PlanAction
                                            busy={busy}
                                            currentInterval={interval}
                                            currentPlan={billing.plan}
                                            isCurrent={isCurrent}
                                            onCancel={() => void cancel()}
                                            onUpgrade={(plan) => void upgrade(plan, yearly)}
                                            planName={planName}
                                            yearly={yearly}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-line bg-bg px-4 py-5 text-center font-mono text-[12px] text-dim">
                            Billing is not configured on this server. Set the Stripe environment
                            variables to enable paid plans.
                        </div>
                    )}
                </SettingsCard>

                {isPaid && billing.billingEnabled ? (
                    <SettingsCard
                        action={
                            <SettingsButton
                                disabled={busy}
                                icon={CreditCard}
                                onClick={() => void openBillingPortal()}
                                variant="ghost"
                            >
                                Open billing portal
                            </SettingsButton>
                        }
                        description="Invoices, receipts and payment methods are managed in the Stripe billing portal."
                        title="Invoices & payment"
                    >
                        <div className="flex items-center gap-2 font-mono text-[11px] text-dim">
                            <Zap className="text-accent" size={12} />
                            Secure checkout and billing handled by Stripe.
                        </div>
                    </SettingsCard>
                ) : null}
            </div>
        </>
    );
}

function formatDate(epochSeconds: number): string {
    return new Date(epochSeconds * 1000).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function PageHeader() {
    return (
        <div className="mb-[26px] border-b border-line pb-[18px]">
            <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Billing & plan</h1>
            <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                Manage your plan and payment details. Limits apply per account and daily counters
                reset at midnight UTC.
            </p>
        </div>
    );
}

function PlanAction({
    busy,
    currentInterval,
    currentPlan,
    isCurrent,
    onCancel,
    onUpgrade,
    planName,
    yearly,
}: PlanActionProps) {
    const baseClass = 'w-full justify-center rounded-md py-[7px] text-center text-[12px]';

    if (isCurrent) {
        const selectedInterval = yearly ? 'year' : 'month';
        const canSwitchInterval =
            planName !== 'free' && currentInterval !== null && currentInterval !== selectedInterval;

        if (canSwitchInterval) {
            return (
                <SettingsButton
                    disabled={busy}
                    onClick={() => onUpgrade(planName as PaidPlanName)}
                    size="sm"
                    variant="ghost"
                >
                    Switch to {yearly ? 'yearly' : 'monthly'}
                </SettingsButton>
            );
        }

        return (
            <div className={`${baseClass} border border-transparent font-semibold text-dim`}>
                Your plan
            </div>
        );
    }

    if (planName === 'free') {
        if (currentPlan === 'free') {
            return null;
        }

        return (
            <SettingsButton disabled={busy} onClick={onCancel} size="sm" variant="ghost">
                Downgrade · cancel subscription
            </SettingsButton>
        );
    }

    return (
        <SettingsButton
            disabled={busy}
            icon={Zap}
            onClick={() => onUpgrade(planName as PaidPlanName)}
            size="sm"
            variant="primary"
        >
            {currentPlan === 'free'
                ? `Upgrade to ${PLANS[planName as PaidPlanName].label}`
                : `Switch to ${PLANS[planName as PaidPlanName].label}`}
        </SettingsButton>
    );
}

function planFeatures(plan: PlanDefinition): string[] {
    const { limits } = plan;

    return [
        `${limits.messagesPerDay.toLocaleString()} messages / day`,
        `${limits.emailsPerDay.toLocaleString()} emails / day`,
        `${Math.floor(limits.attachmentMaxBytes / (1024 * 1024))} MB per attachment`,
        `${limits.maxOwnedTopics} owned topics`,
        `${limits.maxWebhooks} webhooks`,
    ];
}
