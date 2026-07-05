import type { LucideIcon } from 'lucide-react';

import { Boxes, Github, Scale, ShieldCheck } from 'lucide-react';

import { Button } from './button';
import { Eyebrow } from './eyebrow';
import { Section } from './section';

const REPO_URL = 'https://github.com/kevenleone/emitsignal';
const LICENSE_URL = `${REPO_URL}/tree/main?tab=AGPL-3.0-1-ov-file`;

interface Feature {
    desc: string;
    icon: LucideIcon;
    title: string;
}

const FEATURES: Feature[] = [
    {
        desc: 'Run the whole platform on your own infrastructure — server, workers, database, and queues. No vendor lock-in.',
        icon: Boxes,
        title: 'Self-host the whole stack',
    },
    {
        desc: 'Licensed under the GNU AGPLv3. Free to use, study, modify, and share — as long as your changes stay open too.',
        icon: Scale,
        title: 'AGPLv3 licensed',
    },
    {
        desc: 'Every line is on GitHub. Read exactly how your messages are routed, stored, and delivered — no black boxes.',
        icon: ShieldCheck,
        title: 'No black boxes',
    },
];

export function OpenSource() {
    return (
        <Section id="open-source">
            <Eyebrow>OPEN-SOURCE</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[820px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Yours to run, inspect, and extend.
            </h2>
            <p className="mb-8 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                EmitSignal is fully open-source. Host it yourself, audit the delivery path, or send
                a pull request — the entire platform lives in the open.
            </p>

            <div className="mb-12 inline-flex flex-wrap items-center gap-3.5">
                <Button href={REPO_URL} icon={<Github size={13} />} variant="primary">
                    Star on GitHub
                </Button>

                <Button href={LICENSE_URL} icon={<Scale size={13} />}>
                    Read the license · AGPLv3
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
                {FEATURES.map((feature) => (
                    <FeatureCard
                        desc={feature.desc}
                        icon={feature.icon}
                        key={feature.title}
                        title={feature.title}
                    />
                ))}
            </div>
        </Section>
    );
}

interface FeatureCardProps {
    desc: string;
    icon: LucideIcon;
    title: string;
}

function FeatureCard({ desc, icon: Icon, title }: FeatureCardProps) {
    return (
        <div className="rounded-2xl border border-line bg-elev p-7">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent/35 text-accent">
                <Icon size={16} />
            </div>
            <p className="mt-4 m-0 text-[18px] font-semibold tracking-[-0.4px] text-fg">{title}</p>
            <p className="mt-2 m-0 text-[14px] leading-[1.6] text-muted">{desc}</p>
        </div>
    );
}
