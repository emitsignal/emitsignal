import { useEffect, useRef } from 'react';

import type { Message } from '#/lib/api';

import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';
import { relativeTime } from '#/lib/format';
import { priorityHex, priorityLabel } from '#/lib/priority';

const PRIORITY_THRESHOLDS = [3, 4, 5];

interface Props {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    loading: boolean;
    messages: Message[];
    onClear: () => void;
    onPriorityChange: (priority: number | undefined) => void;
    onTagClick: (tag: string) => void;
    onTagsChange: (tags: string[]) => void;
    priority?: number;
    tagOptions: string[];
    tags: string[];
}

export function EventList({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loading,
    messages,
    onClear,
    onPriorityChange,
    onTagClick,
    onTagsChange,
    priority,
    tagOptions,
    tags,
}: Props) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasNextPage || !sentinelRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="min-w-0 flex-1 overflow-auto border-r border-line">
            <FilterRow
                count={messages.length}
                hasNextPage={hasNextPage}
                onClear={onClear}
                onPriorityChange={onPriorityChange}
                onTagsChange={onTagsChange}
                priority={priority}
                tagOptions={tagOptions}
                tags={tags}
            />

            {loading ? (
                <div className="p-5.5 font-mono text-[12px] text-dim">loading…</div>
            ) : messages.length === 0 ? (
                <div className="p-5.5 font-mono text-[12px] text-dim">
                    no messages in this channel
                </div>
            ) : (
                messages.map((message) => (
                    <EventRow event={message} key={message.id} onTagClick={onTagClick} />
                ))
            )}

            <div className="h-px" ref={sentinelRef} />
            {isFetchingNextPage && (
                <div className="py-3 text-center font-mono text-[11px] text-dim">loading…</div>
            )}
        </div>
    );
}

function EventRow({ event, onTagClick }: { event: Message; onTagClick: (tag: string) => void }) {
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
                        <button
                            className="rounded border border-line bg-chip px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:border-accent hover:text-accent"
                            key={tag}
                            onClick={() => onTagClick(tag)}
                            type="button"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FilterRow({
    count,
    hasNextPage,
    onClear,
    onPriorityChange,
    onTagsChange,
    priority,
    tagOptions,
    tags,
}: {
    count: number;
    hasNextPage: boolean;
    onClear: () => void;
    onPriorityChange: (priority: number | undefined) => void;
    onTagsChange: (tags: string[]) => void;
    priority?: number;
    tagOptions: string[];
    tags: string[];
}) {
    function toggleTag(tag: string) {
        onTagsChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
    }

    const hasActiveFilter = priority !== undefined || tags.length > 0;

    return (
        <div className="flex flex-wrap items-center gap-3 px-5.5 py-2.5 font-mono text-[10px] tracking-[1.4px] text-dim">
            <span>RECENT</span>
            <span className="text-faint">·</span>
            <span className="text-muted">filter:</span>

            {PRIORITY_THRESHOLDS.map((threshold) => {
                const active = priority === threshold;
                const color = priorityHex(threshold);

                return (
                    <button
                        className="rounded border px-1.5 py-0.5 transition-colors"
                        key={threshold}
                        onClick={() => onPriorityChange(active ? undefined : threshold)}
                        style={{
                            background: active ? `${color}1c` : 'transparent',
                            borderColor: active ? color : 'var(--color-line)',
                            color: active ? color : undefined,
                        }}
                        title={`${priorityLabel(threshold)} and above`}
                        type="button"
                    >
                        priority:&gt;={threshold}
                    </button>
                );
            })}

            {tagOptions.map((tag) => {
                const active = tags.includes(tag);

                return (
                    <button
                        className={cn(
                            'rounded border border-line px-1.5 py-0.5 transition-colors',
                            active ? 'bg-accent/10 text-accent' : 'bg-chip',
                        )}
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        type="button"
                    >
                        tag:{tag}
                    </button>
                );
            })}

            {hasActiveFilter && (
                <button
                    className="text-muted transition-colors hover:text-fg"
                    onClick={onClear}
                    type="button"
                >
                    clear
                </button>
            )}

            <span className="ml-auto">
                {count}
                {hasNextPage ? '+' : ''} messages
            </span>
        </div>
    );
}
