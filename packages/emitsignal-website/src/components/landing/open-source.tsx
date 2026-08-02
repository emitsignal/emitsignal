import type { LucideIcon } from 'lucide-react';

import { Boxes, Github, Scale, ShieldCheck } from 'lucide-react';

import { LICENSE_URL, REPO_URL } from '#/lib/links';

import { Button } from './button';
import { Section } from './section';

interface Feature {
    desc: string;
    icon: LucideIcon;
    title: string;
}

const [LEAD_FEATURE, ...SUPPORTING_FEATURES]: Feature[] = [
    {
        desc: 'Run the whole platform on your own infrastructure: server, workers, database, and queues. No vendor lock-in.',
        icon: Boxes,
        title: 'Self-host the whole stack',
    },
    {
        desc: 'Licensed under the GNU AGPLv3. Free to use, study, modify, and share, as long as your changes stay open too.',
        icon: Scale,
        title: 'AGPLv3 licensed',
    },
    {
        desc: 'Every line is on GitHub. Read exactly how your messages are routed, stored, and delivered.',
        icon: ShieldCheck,
        title: 'No black boxes',
    },
];

export function OpenSource() {
    return (
        <Section id="open-source">
            <h2 className="m-0 mb-4 max-w-[820px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Yours to run, inspect, and extend.
            </h2>
            <p className="mb-8 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                EmitSignal is fully open-source. Host it yourself, audit the delivery path, or send
                a pull request. The entire platform lives in the open.
            </p>

            <div className="mb-12 inline-flex flex-wrap items-center gap-3.5">
                <Button href={REPO_URL} icon={<Github size={13} />} variant="primary">
                    Star on GitHub
                </Button>

                <Button href={LICENSE_URL} icon={<Scale size={13} />}>
                    Read the license
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-[1.35fr_1fr]">
                <FeatureBlock feature={LEAD_FEATURE} lead />
                <div className="grid gap-[18px]">
                    {SUPPORTING_FEATURES.map((feature) => (
                        <FeatureBlock feature={feature} key={feature.title} />
                    ))}
                </div>
            </div>
        </Section>
    );
}

function FeatureBlock({ feature, lead = false }: { feature: Feature; lead?: boolean }) {
    const { desc, icon: Icon, title } = feature;

    return (
        <div className="flex h-full flex-col justify-center rounded-xl border border-line bg-elev p-7">
            <Icon className="text-accent" size={lead ? 22 : 18} />
            <p
                className={
                    lead
                        ? 'mt-5 m-0 text-[26px] font-semibold leading-[1.15] tracking-[-0.7px] text-fg'
                        : 'mt-4 m-0 text-[18px] font-semibold tracking-[-0.4px] text-fg'
                }
            >
                {title}
            </p>
            <p
                className={
                    lead
                        ? 'mt-3 m-0 max-w-[42ch] text-[15px] leading-[1.6] text-muted'
                        : 'mt-2 m-0 text-[14px] leading-[1.6] text-muted'
                }
            >
                {desc}
            </p>
        </div>
    );
}
