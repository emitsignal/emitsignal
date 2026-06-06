import { ArrowRight, Check, Clock, Globe, Zap } from 'lucide-react';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsGroup } from './settings-group';
import { SettingsPill } from './settings-pill';
import { UsageBar } from './usage-bar';

interface PlanTier {
    features: readonly string[];
    isCurrent?: boolean;
    key: string;
    label: string;
    price: string;
    tag: string;
}

const PLAN_TIERS: PlanTier[] = [
    {
        features: ['3 channels', '10k signals/mo', '1 seat', '7-day retention'],
        key: 'free',
        label: 'Free',
        price: '$0',
        tag: 'Hobby',
    },
    {
        features: ['25 channels', '500k signals/mo', '5 seats', '30-day retention'],
        key: 'pro',
        label: 'Pro',
        price: '$29',
        tag: 'Solo & small teams',
    },
    {
        features: ['Unlimited channels', '5M signals/mo', '25 seats', 'SSO + on-call'],
        isCurrent: true,
        key: 'team',
        label: 'Team',
        price: '$290',
        tag: 'Current plan',
    },
];

const USAGE_METRICS = [
    { color: 'var(--color-accent)', label: 'Signals delivered', total: 5_000_000, used: 3_120_000 },
    { color: 'var(--color-info)', label: 'Seats used', total: 25, used: 18 },
    { color: 'var(--color-pink)', label: 'API requests', total: 1_000_000, used: 882_000 },
    { color: 'var(--color-success)', label: 'Active channels', total: 9_999, used: 64 },
] as const;

const INVOICES = [
    { amount: '$3,480.00', date: 'Mar 1, 2026', id: 'INV-2026-0312', status: 'paid' as const },
    { amount: '$3,480.00', date: 'Mar 1, 2025', id: 'INV-2025-0291', status: 'paid' as const },
    { amount: '$2,990.00', date: 'Mar 1, 2024', id: 'INV-2024-0188', status: 'paid' as const },
    { amount: '$120.00', date: 'Aug 14, 2024', id: 'INV-2024-0042', status: 'refunded' as const },
] as const;

export function BillingPage() {
    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Billing & plan</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Your workspace is on the Team plan, billed yearly. Manage your plan, payment
                    method, and download past invoices.
                </p>
            </div>

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
                                    Team
                                </span>
                                <SettingsPill tone="accent-solid">CURRENT</SettingsPill>
                                <SettingsPill tone="success">YEARLY</SettingsPill>
                            </div>
                            <p className="text-[13px] leading-[1.55] text-muted">
                                Unlimited channels · 5M signals / mo · 25 seats · 90-day retention ·
                                SSO · priority routing & on-call escalation.
                            </p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                            <div className="font-mono text-[30px] font-semibold tracking-[-1px]">
                                $290
                            </div>
                            <div className="font-mono text-[11px] text-dim">
                                / mo · billed annually
                            </div>
                        </div>
                    </div>

                    <div className="mt-[18px] flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <Clock className="shrink-0 text-dim" size={13} />
                        <span className="font-mono text-[11.5px] text-muted">
                            Renews Mar 1, 2027 · $3,480 / yr
                        </span>
                        <div className="flex flex-wrap gap-2.5 sm:ml-auto">
                            <SettingsButton variant="ghost">Switch to monthly</SettingsButton>
                            <SettingsButton icon={Zap} variant="primary">
                                Upgrade plan
                            </SettingsButton>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard
                    description="Feb 1 – Feb 28 · resets in 4 days"
                    title="Usage this period"
                >
                    <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
                        {USAGE_METRICS.map((metric) => (
                            <div key={metric.label}>
                                <div className="mb-3 text-[12.5px] font-medium">{metric.label}</div>
                                <UsageBar
                                    color={metric.color}
                                    total={metric.total}
                                    used={metric.used}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-dim">
                        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                        API requests trending high — you&apos;ll hit the cap ~Feb 26 at current
                        rate.
                    </div>
                </SettingsCard>

                <SettingsCard
                    description="Upgrades apply immediately and are prorated. Downgrades take effect next cycle."
                    title="Change plan"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {PLAN_TIERS.map((tier) => (
                            <div
                                className={`rounded-[9px] border p-4 ${
                                    tier.isCurrent
                                        ? 'border-accent bg-accent/10'
                                        : 'border-line bg-bg'
                                }`}
                                key={tier.key}
                            >
                                <div className="mb-1 flex items-center justify-between">
                                    <span
                                        className={`text-[14px] font-bold ${tier.isCurrent ? 'text-accent' : 'text-fg'}`}
                                    >
                                        {tier.label}
                                    </span>
                                    {tier.isCurrent ? (
                                        <SettingsPill tone="accent-solid">ON</SettingsPill>
                                    ) : null}
                                </div>
                                <div className="mb-3 font-mono text-[10px] text-dim">
                                    {tier.tag}
                                </div>
                                <div className="mb-3.5">
                                    <span className="font-mono text-[22px] font-semibold">
                                        {tier.price}
                                    </span>
                                    <span className="font-mono text-[10px] text-dim"> /mo</span>
                                </div>
                                <div className="mb-4 flex flex-col gap-[7px]">
                                    {tier.features.map((feature) => (
                                        <div
                                            className="flex items-center gap-2 text-[11.5px] text-muted"
                                            key={feature}
                                        >
                                            <Check
                                                className={`shrink-0 ${tier.isCurrent ? 'text-accent' : 'text-success'}`}
                                                size={11}
                                            />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className={`rounded-md border py-[7px] text-center text-[12px] font-semibold ${
                                        tier.isCurrent
                                            ? 'border-transparent text-dim'
                                            : 'border-line text-fg hover:bg-elev-2'
                                    }`}
                                >
                                    {tier.isCurrent
                                        ? 'Your plan'
                                        : tier.key === 'free'
                                          ? 'Downgrade'
                                          : 'Switch'}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-lg border border-line bg-bg px-3.5 py-3">
                        <Globe className="shrink-0 text-accent" size={14} />
                        <span className="flex-1 text-[12.5px] text-muted">
                            Need SAML provisioning, audit exports, or a custom SLA?
                        </span>
                        <SettingsButton variant="ghost">Talk to sales · Enterprise</SettingsButton>
                    </div>
                </SettingsCard>

                <SettingsCard
                    action={
                        <SettingsButton icon={ArrowRight} variant="ghost">
                            Export CSV
                        </SettingsButton>
                    }
                    title="Billing history"
                >
                    <div className="overflow-x-auto">
                        <SettingsGroup className="min-w-[480px]">
                            <div className="grid grid-cols-[1.4fr_1fr_1fr_90px_70px] gap-3 border-b border-line bg-bg px-4 py-[9px] font-mono text-[9.5px] tracking-[1.2px] text-dim">
                                <span>INVOICE</span>
                                <span>DATE</span>
                                <span>AMOUNT</span>
                                <span>STATUS</span>
                                <span className="text-right">PDF</span>
                            </div>
                            {INVOICES.map((invoice, index) => (
                                <div
                                    className={`grid grid-cols-[1.4fr_1fr_1fr_90px_70px] items-center gap-3 px-4 py-3 font-mono text-[12px] ${
                                        index < INVOICES.length - 1 ? 'border-b border-line' : ''
                                    }`}
                                    key={invoice.id}
                                >
                                    <span>{invoice.id}</span>
                                    <span className="text-muted">{invoice.date}</span>
                                    <span>{invoice.amount}</span>
                                    <span>
                                        {invoice.status === 'paid' ? (
                                            <SettingsPill tone="success">PAID</SettingsPill>
                                        ) : (
                                            <SettingsPill tone="dim">REFUNDED</SettingsPill>
                                        )}
                                    </span>
                                    <span className="flex justify-end">
                                        <ArrowRight className="text-accent" size={13} />
                                    </span>
                                </div>
                            ))}
                        </SettingsGroup>
                    </div>
                </SettingsCard>
            </div>
        </>
    );
}
