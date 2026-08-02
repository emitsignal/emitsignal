import { Section } from './section';

interface UseCase {
    channel: string;
    code: string;
    color: string;
    title: string;
}

const CASES: UseCase[] = [
    {
        channel: 'alerts/prod',
        code: 'priority:5 → sms + push + slack',
        color: 'text-danger',
        title: 'On-call paging without PagerDuty.',
    },
    {
        channel: 'deploy/prod',
        code: 'CI → emitsignal publish deploy/prod',
        color: 'text-accent',
        title: 'Deploys announced everywhere.',
    },
    {
        channel: 'cron/backup',
        code: 'emitsignal run "pg_dump | gzip > /tmp"',
        color: 'text-warn',
        title: 'Cron jobs that tell you they ran.',
    },
    {
        channel: 'errors/web',
        code: 'tag:new AND p>=4 → page',
        color: 'text-danger',
        title: 'Error firehose, your routing rules.',
    },
    {
        channel: 'me/personal',
        code: 'echo "$THING" | emitsignal publish me',
        color: 'text-info',
        title: 'A pager for your own life.',
    },
    {
        channel: 'github/repo',
        code: 'event:review_requested → push',
        color: 'text-info',
        title: 'Filter the noise out of GitHub.',
    },
];

export function UseCases() {
    return (
        <Section id="use-cases">
            <h2 className="m-0 mb-4 max-w-[820px] text-[28px] font-semibold leading-[1.05] tracking-[-1px] text-fg sm:text-[36px] md:text-[44px] md:tracking-[-1.4px]">
                Anything that emits a status line.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                Deploys, backups, error spikes, a sensor in your garage. Topics are free-form
                strings, so the list is up to you.
            </p>

            <div className="grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2">
                {CASES.map((useCase) => (
                    <UseCaseItem key={useCase.channel} useCase={useCase} />
                ))}
            </div>
        </Section>
    );
}

function UseCaseItem({ useCase }: { useCase: UseCase }) {
    return (
        <div className="border-l border-line pl-5">
            <span className={`font-mono text-[11.5px] font-semibold ${useCase.color}`}>
                {useCase.channel}
            </span>
            <p className="m-0 mb-3 mt-2 text-[18px] font-semibold leading-[1.25] tracking-[-0.3px]">
                {useCase.title}
            </p>
            <code className="block overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-dim">
                {useCase.code}
            </code>
        </div>
    );
}
