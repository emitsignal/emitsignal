import { cn } from '#/lib/cn';

import { Eyebrow } from './eyebrow';
import { Section } from './section';

interface Step {
    code: string;
    subtitle: string;
    title: string;
}

const STEPS: Step[] = [
    {
        code: `# from a shell
$ echo "v2.14.3 shipped" | emitsignal publish deploy/prod -p4

# from CI (one line)
$ curl emitsignal.com/ci/web -d "build #4821 passed"

# from anywhere
$ pg_dump prod | gzip > /tmp/bak.gz && \\
    emitsignal publish cron/backup "$(date)"`,
        subtitle:
            'Curl, the CLI, a webhook, GitHub Actions, a python script, or a one-line shell pipe. If it can hit an HTTP endpoint, it can publish.',
        title: 'Publish from anywhere.',
    },
    {
        code: `# routing for alerts/prod
priority:5            → push + sms + slack #oncall
priority:4            → push + slack #alerts
priority:<=3          → inbox only
tag:sev2              → page on-call rotation
tag:resolved          → silence
hour:between(0,7)     → batch, digest at 08:00`,
        subtitle:
            'Per-channel rules: priority, tags, regex, deliver-window. Everything is a topic, topics are free-form strings, and rules cascade.',
        title: 'Route with filters.',
    },
    {
        code: `# read from your terminal
$ emitsignal listen alerts/prod

# read in a TUI
$ emitsignal tui

# read in a script
$ emitsignal listen --format json | jq -r .title

# read on your phone, web, or slack automatically`,
        subtitle:
            'Phone, terminal, web inbox, slack, email, webhook, RSS. Read once and it syncs everywhere.',
        title: 'Deliver wherever you read.',
    },
];

export function HowItWorks() {
    return (
        <Section id="how">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[780px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                One verb. Three steps. Zero SDKs.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                Topics are strings. Subscriptions are URLs. Routing is a short expression. That is
                the entire mental model.
            </p>

            <div className="grid gap-[18px]">
                {STEPS.map((step, index) => (
                    <StepCard key={step.title} reversed={index % 2 === 1} step={step} />
                ))}
            </div>
        </Section>
    );
}

function StepCard({ reversed, step }: { reversed: boolean; step: Step }) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 items-center gap-6 rounded-xl border border-line bg-elev px-5 py-6 md:gap-10 md:px-9 md:py-8',
                reversed ? 'md:grid-cols-[1.4fr_1fr]' : 'md:grid-cols-[1fr_1.4fr]',
            )}
        >
            <div className={cn(reversed && 'md:order-2')}>
                <h3 className="m-0 mb-3 text-[26px] font-semibold leading-[1.1] tracking-[-0.7px]">
                    {step.title}
                </h3>
                <p className="m-0 text-[15px] leading-[1.55] text-muted">{step.subtitle}</p>
            </div>
            <pre
                className={cn(
                    'm-0 overflow-x-auto rounded-xl bg-deep px-4.5 py-4 font-mono text-[12.5px] leading-[1.7] text-fg',
                    reversed && 'md:order-1',
                )}
            >
                {step.code}
            </pre>
        </div>
    );
}
