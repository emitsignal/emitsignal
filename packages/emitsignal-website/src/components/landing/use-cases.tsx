import { Dot } from '#/components/ui/dot';

import { Eyebrow } from './eyebrow';
import { Section } from './section';

interface UseCase {
    channel: string;
    code: string;
    color: string;
    priority: number;
    title: string;
}

const CASES: UseCase[] = [
    {
        channel: 'alerts/prod',
        code: 'priority:5 → sms + push + slack',
        color: 'text-danger',
        priority: 5,
        title: 'On-call paging without PagerDuty.',
    },
    {
        channel: 'deploy/prod',
        code: 'CI → emitsignal publish deploy/prod',
        color: 'text-accent',
        priority: 4,
        title: 'Deploys announced everywhere.',
    },
    {
        channel: 'cron/backup',
        code: 'emitsignal run "pg_dump | gzip > /tmp"',
        color: 'text-warn',
        priority: 3,
        title: 'Cron jobs that tell you they’re alive.',
    },
    {
        channel: 'errors/web',
        code: 'tag:new AND p>=4 → page',
        color: 'text-danger',
        priority: 5,
        title: 'Sentry-grade firehose, your routing.',
    },
    {
        channel: 'me/personal',
        code: 'echo "$THING" | emitsignal publish me',
        color: 'text-info',
        priority: 2,
        title: 'A pager for your own life.',
    },
    {
        channel: 'github/repo',
        code: 'event:review_requested → push',
        color: 'text-info',
        priority: 2,
        title: 'Filter the noise out of GitHub.',
    },
];

export function UseCases() {
    return (
        <Section id="use-cases">
            <Eyebrow>USE CASES</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[820px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Anything that emits a status line.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                People ship deploys with us. They watch their freezer. They get paged at 4am when
                the API forgets how to count. Topics are strings — go wild.
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                {CASES.map((useCase, index) => (
                    <UseCaseCard key={index} useCase={useCase} />
                ))}
            </div>
        </Section>
    );
}

function UseCaseCard({ useCase }: { useCase: UseCase }) {
    return (
        <div className="rounded-xl border border-line bg-elev p-5.5">
            <div className="mb-3.5 flex items-center gap-2">
                <Dot level={useCase.priority} />
                <span className={`font-mono text-[11.5px] font-semibold ${useCase.color}`}>
                    {useCase.channel}
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-faint">
                    p{useCase.priority}
                </span>
            </div>
            <p className="m-0 mb-4 text-[18px] font-semibold leading-[1.25] tracking-[-0.3px]">
                {useCase.title}
            </p>
            <div className="rounded-md border border-line bg-deep px-3 py-2 font-mono text-[11.5px] text-muted">
                {useCase.code}
            </div>
        </div>
    );
}
