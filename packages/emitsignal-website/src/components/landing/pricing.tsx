import { AlertTriangle } from 'lucide-react';

import { cn } from '#/lib/cn';

import { Eyebrow } from './eyebrow';
import { Section } from './section';

interface Tier {
    cta: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    name: string;
    price: string;
    priceSubtitle: string;
    tag?: string;
}

const TIERS: Tier[] = [
    {
        cta: 'Start free',
        description: 'For your own pager, side-projects, and trying it out.',
        features: [
            '10,000 signals / month',
            '5 channels',
            '1 user',
            'Push + email + RSS',
            'Community support',
        ],
        name: 'Free',
        price: '$0',
        priceSubtitle: 'forever, for hobby use',
    },
    {
        cta: 'Start 14-day trial',
        description: 'For teams that ship code and want to know about it.',
        features: [
            '1M signals / month / user',
            'Unlimited channels',
            'SSO · SAML · SCIM',
            'SMS + Slack + Webhooks',
            'Routing rules · regex filters',
            'Audit log · 90d retention',
        ],
        highlighted: true,
        name: 'Team',
        price: '$24',
        priceSubtitle: '/ user / month',
        tag: 'most popular',
    },
    {
        cta: 'Talk to sales',
        description: 'For when 4am paging needs to be on contract.',
        features: [
            'Unlimited signals',
            'Self-hosted available',
            'Dedicated cluster',
            'On-call rotation tooling',
            '99.99% SLA',
            'Custom retention · BYOK',
        ],
        name: 'Enterprise',
        price: 'Custom',
        priceSubtitle: 'volume + on-prem',
    },
];

export function Pricing() {
    return (
        <Section
            id="pricing"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(26,22,37,0.33))' }}
        >
            <Eyebrow>PRICING</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[780px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Pay for what you push.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                No per-seat tax on read-only viewers. No SDK to license. The free tier is real —
                many teams stay on it.
            </p>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
                {TIERS.map((tier) => (
                    <TierCard key={tier.name} tier={tier} />
                ))}
            </div>

            <div className="mt-8 flex items-center gap-4 rounded-xl border border-dashed border-line px-5 py-4 font-mono text-[12px] text-muted">
                <AlertTriangle className="text-warn shrink-0" size={14} />
                <span>
                    A signal = one published message. Receiving is free — same signal to 200
                    subscribers still counts as 1.
                </span>
                <a className="ml-auto text-accent no-underline" href="#">
                    see fair-use →
                </a>
            </div>
        </Section>
    );
}

function TierCard({ tier }: { tier: Tier }) {
    return (
        <div
            className={cn(
                'relative rounded-2xl border px-7 py-8',
                tier.highlighted
                    ? 'border-accent bg-elev shadow-[0_0_0_4px_rgba(167,139,250,0.1)]'
                    : 'border-line bg-transparent',
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
            <p className="min-h-[42px] m-0 mb-5.5 text-[14px] leading-[1.5] text-muted">
                {tier.description}
            </p>
            <ul className="m-0 mb-6.5 flex list-none flex-col gap-2.5 p-0">
                {tier.features.map((feature) => (
                    <li className="flex items-start gap-2.5 text-[13px] text-muted" key={feature}>
                        <span className="font-mono leading-[1.5] text-accent">→</span>
                        <span className="leading-[1.5]">{feature}</span>
                    </li>
                ))}
            </ul>
            <a
                className={cn(
                    'block rounded-lg px-4 py-3 text-center font-mono text-[13px] font-semibold no-underline',
                    tier.highlighted
                        ? 'bg-accent text-bg hover:bg-accent-dim'
                        : 'border border-line text-fg hover:bg-elev',
                )}
                href="#"
            >
                {tier.cta}
            </a>
        </div>
    );
}
