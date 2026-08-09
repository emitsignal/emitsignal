import type { PlanDefinition } from '@emitsignal/shared/billing';

import { PLAN_ORDER, PLANS } from '@emitsignal/shared/billing';
import { AlertTriangle } from 'lucide-react';

import { cn } from '#/lib/cn';

import { Eyebrow } from './eyebrow';
import { Section } from './pricing-section';

interface Tier {
    cta: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    href: string;
    name: string;
    price: string;
    priceSubtitle: string;
    tag?: string;
}

function planTier(plan: PlanDefinition): Tier {
    const { limits } = plan;

    const features = [
        `${limits.messagesPerDay.toLocaleString()} messages / day`,
        `${limits.emailsPerDay.toLocaleString()} emails / day`,
        `${Math.floor(limits.attachmentMaxBytes / (1024 * 1024))} MB per attachment`,
        `${limits.maxOwnedTopics} owned topics`,
        `${limits.maxWebhooks} webhooks`,
        'Push + SSE + web inbox',
    ];

    if (plan.name === 'free') {
        return {
            cta: 'Get started',
            description: plan.description,
            features,
            href: '/sign-in',
            name: plan.label,
            price: '$0',
            priceSubtitle: 'forever, for hobby use',
        };
    }

    return {
        cta: `Get ${plan.label}`,
        description: plan.description,
        features,
        highlighted: plan.name === 'pulse',
        href: '/app/settings/billing',
        name: plan.label,
        price: `$${plan.priceMonthlyUsd}`,
        priceSubtitle: `/ month, or $${plan.priceYearlyUsd}/yr`,
        tag: plan.name === 'pulse' ? 'most popular' : undefined,
    };
}

const TIERS: Tier[] = PLAN_ORDER.map((planName) => planTier(PLANS[planName]));

export function Pricing() {
    return (
        <Section
            id="pricing"
            style={{
                background:
                    'linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-elev) 55%, transparent))',
            }}
        >
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[780px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Pay for what you push.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                No per-seat tax. No SDK to license. Pay yearly and get 2 months free.
            </p>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
                {TIERS.map((tier) => (
                    <TierCard key={tier.name} tier={tier} />
                ))}
            </div>

            <div className="mt-8 flex items-center gap-4 rounded-xl border border-dashed border-line px-5 py-4 font-mono text-[12px] text-muted">
                <AlertTriangle className="text-warn shrink-0" size={14} />
                <span>
                    A message is one published signal. Receiving is free, so the same signal sent to
                    200 subscribers still counts as 1. Daily limits reset at midnight UTC.
                </span>
            </div>
        </Section>
    );
}

function TierCard({ tier }: { tier: Tier }) {
    return (
        <div
            className={cn(
                'relative flex h-full flex-col rounded-xl border px-7 py-8',
                tier.highlighted ? 'border-accent bg-elev' : 'border-line bg-transparent',
            )}
        >
            {tier.tag && (
                <span className="absolute -top-2.5 left-7 rounded-full bg-accent px-2.5 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[1.2px] text-bg">
                    {tier.tag}
                </span>
            )}
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[1.4px] text-dim">
                {tier.name}
            </p>
            <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-[44px] font-semibold tracking-[-1.4px]">{tier.price}</span>
                <span className="font-mono text-[12.5px] text-dim">{tier.priceSubtitle}</span>
            </div>
            <p className="m-0 mb-5.5 text-[14px] leading-[1.5] text-muted">{tier.description}</p>
            <ul className="m-0 mb-6.5 flex flex-1 list-none flex-col gap-2.5 p-0">
                {tier.features.map((feature) => (
                    <li className="flex items-start gap-2.5 text-[13px] text-muted" key={feature}>
                        <span className="font-mono leading-[1.5] text-accent">→</span>
                        <span className="leading-[1.5]">{feature}</span>
                    </li>
                ))}
            </ul>
            <a
                className={cn(
                    'block rounded-lg px-4 py-3 text-center font-mono text-[13px] font-semibold no-underline active:translate-y-px',
                    tier.highlighted
                        ? 'bg-accent text-bg hover:bg-accent-hover'
                        : 'border border-line text-fg hover:bg-elev',
                )}
                href={tier.href}
            >
                {tier.cta}
            </a>
        </div>
    );
}
