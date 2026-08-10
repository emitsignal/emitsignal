import { Code } from '#/components/ui/code';
import { Dot } from '#/components/ui/dot';
import { SubHeading } from '#/components/ui/sub-head';
import { api } from '#/lib/api';

interface Props {
    body: string;
    priority: number;
    tags: string[];
    title: string;
    topicName: string;
}

export function PreviewColumn({ body, priority, tags, title, topicName }: Props) {
    const curlCmd = topicName
        ? `curl -X POST ${api.baseUrl}/publish/${topicName} \\
  -H "Authorization: Bearer es_••••" \\
  -H "Priority: ${priority}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ body: body || '...', priority, tags, title: title || '...' })}'`
        : 'fill in topic to see curl example';

    return (
        <aside className="w-[380px] shrink-0 overflow-auto bg-deep p-6">
            <SubHeading>PREVIEW · android push</SubHeading>
            <div className="mb-5 rounded-2xl border border-line bg-elev p-3.5">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] text-dim">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-accent text-[9px] font-bold text-bg">
                        E
                    </span>
                    <span>EMITSIGNAL · {topicName || 'channel/topic'} · now</span>
                </div>
                <p className="m-0 mb-1 text-[14px] font-semibold">{title || 'Untitled'}</p>
                <p className="m-0 text-[12.5px] leading-[1.4] text-muted">{body || 'body empty'}</p>
            </div>

            <SubHeading>EQUIVALENT · curl</SubHeading>
            <Code language="BASH">{curlCmd}</Code>

            <div className="h-4" />

            <SubHeading>WILL REACH</SubHeading>
            <div className="flex flex-col gap-2">
                {[
                    'all subscribed devices',
                    'email · if priority >= 4',
                    'slack · if configured',
                ].map((recipient, index) => (
                    <div
                        className="flex items-center gap-2 font-mono text-[11.5px] text-muted"
                        key={index}
                    >
                        <Dot level={2} size={5} />
                        {recipient}
                    </div>
                ))}
            </div>
        </aside>
    );
}
