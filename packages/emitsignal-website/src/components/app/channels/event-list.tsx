import type { Message } from '#/lib/api';

import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';
import { relativeTime } from '#/lib/format';

interface Props {
    loading: boolean;
    messages: Message[];
}

export function EventList({ loading, messages }: Props) {
    return (
        <div className="min-w-0 flex-1 overflow-auto border-r border-line">
            <FilterRow count={messages.length} />

            {loading ? (
                <div className="p-5.5 font-mono text-[12px] text-dim">loading…</div>
            ) : messages.length === 0 ? (
                <div className="p-5.5 font-mono text-[12px] text-dim">
                    no messages in this channel
                </div>
            ) : (
                messages.map((message) => <EventRow event={message} key={message.id} />)
            )}
        </div>
    );
}

function EventRow({ event }: { event: Message }) {
    return (
        <div
            className={cn(
                'flex gap-3 border-b border-line px-5.5 py-3 border-l-[3px]',
                'border-l-transparent',
            )}
        >
            <Dot className="mt-[7px]" level={event.priority} size={7} />

            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2.5">
                    <span className="text-[13.5px] font-semibold">{event.title || event.id}</span>
                    <span className="ml-auto font-mono text-[10.5px] text-dim">
                        {relativeTime(event.createdAt)}
                    </span>
                </div>

                <p className="m-0 mb-1.5 text-[12.5px] text-muted">{event.body}</p>
                <div className="flex gap-1.5">
                    {event.tags?.map((tag) => (
                        <span
                            className="rounded border border-line bg-chip px-1.5 py-0.5 font-mono text-[10px] text-muted"
                            key={tag}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FilterRow({ count }: { count: number }) {
    return (
        <div className="flex items-center gap-3 px-5.5 py-2.5 font-mono text-[10px] tracking-[1.4px] text-dim">
            <span>RECENT</span>
            <span className="text-faint">·</span>
            <span className="text-muted">filter:</span>
            <span className="rounded border border-line bg-chip px-1.5 py-0.5 text-accent">
                priority:&gt;=4
            </span>
            <span className="rounded border border-line bg-chip px-1.5 py-0.5">tag:sev2</span>
            <span className="ml-auto">{count} messages</span>
        </div>
    );
}
