import { TOPIC_NAME_MAX_LENGTH } from '@emitsignal/shared/topic';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import type { Message } from '#/lib/api';
import type { Priority } from '#/lib/priority';

import { NotificationRow } from '#/components/app/inbox/notif-row';
import { InboxPreview } from '#/components/app/inbox/preview';
import { PriorityHeader, PriorityRow } from '#/components/app/inbox/priority-row';
import { TimelineDateLabel, TimelineRow } from '#/components/app/inbox/timeline-row';
import { Toolbar } from '#/components/app/toolbar';
import { useFeedStyle } from '#/ctx/feed-style';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useToast } from '#/ctx/toast';
import { useFeed } from '#/hooks/use-emit-signal';
import { apiErrorMessage } from '#/lib/api-error';

interface ListProps extends SubListProps {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

interface SubListProps {
    messages: Message[];
    onSelect: (id: string) => void;
    selectedId: null | string;
}

export function InboxLayout({ selectedId }: { selectedId: null | string }) {
    const { fetchNextPage, hasNextPage, isFetchingNextPage, loading, messages, subscriptions } =
        useFeed();
    const navigate = useNavigate();

    const channelCount = subscriptions.length;
    const subtitle = loading
        ? 'loading…'
        : `${messages.length}${hasNextPage ? '+' : ''} messages · ${channelCount} channels active`;

    const selected = selectedId
        ? (messages.find((message) => message.id === selectedId) ?? null)
        : null;

    const handleSelect = (id: string) => {
        navigate({ params: { messageId: id }, to: '/app/inbox/$messageId' });
    };

    return (
        <>
            <Toolbar actions={<SubscribeButton />} subtitle={subtitle} title="Inbox" />

            <div className="flex min-h-0 flex-1">
                <NotificationList
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    messages={messages}
                    onSelect={handleSelect}
                    selectedId={selectedId}
                />
                <InboxPreview message={selected} />
            </div>
        </>
    );
}

function ComfyList({ messages, onSelect, selectedId }: SubListProps) {
    const now = messages.slice(0, 2);
    const earlier = messages.slice(2);

    return (
        <>
            {now.length > 0 && (
                <>
                    <SectionLabel>NOW</SectionLabel>

                    {now.map((message) => (
                        <NotificationRow
                            active={message.id === selectedId}
                            key={message.id}
                            message={message}
                            onClick={() => onSelect(message.id)}
                        />
                    ))}
                </>
            )}

            {earlier.length > 0 && (
                <>
                    <SectionLabel>EARLIER</SectionLabel>

                    {earlier.map((message) => (
                        <NotificationRow
                            active={message.id === selectedId}
                            key={message.id}
                            message={message}
                            onClick={() => onSelect(message.id)}
                        />
                    ))}
                </>
            )}
        </>
    );
}

function dayLabel(createdAt: number): string {
    const startOfDay = (value: Date) =>
        new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

    const diffDays = Math.round(
        (startOfDay(new Date()) - startOfDay(new Date(createdAt))) / 86400000,
    );

    if (diffDays === 0) {
        return 'Today';
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    return new Date(createdAt).toLocaleDateString('en-US');
}

function NotificationList({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    messages,
    onSelect,
    selectedId,
}: ListProps) {
    const { feedStyle } = useFeedStyle();
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

    if (messages.length === 0) {
        return (
            <div className="flex w-[380px] shrink-0 items-center justify-center border-r border-line p-4 font-mono text-[12px] text-dim">
                no messages yet · subscribe to a channel
            </div>
        );
    }

    return (
        <div className="w-[380px] shrink-0 overflow-auto border-r border-line">
            {feedStyle === 'comfy' && (
                <ComfyList messages={messages} onSelect={onSelect} selectedId={selectedId} />
            )}

            {feedStyle === 'timeline' && (
                <TimelineList messages={messages} onSelect={onSelect} selectedId={selectedId} />
            )}

            {feedStyle === 'priority' && (
                <PriorityList messages={messages} onSelect={onSelect} selectedId={selectedId} />
            )}

            <div className="h-px" ref={sentinelRef} />

            {isFetchingNextPage && (
                <div className="py-3 text-center font-mono text-[11px] text-dim">loading…</div>
            )}
        </div>
    );
}

const levels: Priority[] = [5, 4, 3, 2, 1];

function PriorityList({ messages, onSelect, selectedId }: SubListProps) {
    const groups = useMemo(() => {
        const byLevel = new Map<Priority, Message[]>();

        for (const message of messages) {
            const level = message.priority as Priority;
            const bucket = byLevel.get(level);

            if (bucket) {
                bucket.push(message);
            } else {
                byLevel.set(level, [message]);
            }
        }

        return byLevel;
    }, [messages]);

    return (
        <>
            {levels.map((level) => {
                const group = groups.get(level);

                if (!group || group.length === 0) {
                    return null;
                }

                return (
                    <Fragment key={level}>
                        <PriorityHeader level={level} />
                        {group.map((message) => (
                            <PriorityRow
                                active={message.id === selectedId}
                                key={message.id}
                                message={message}
                                onClick={() => onSelect(message.id)}
                            />
                        ))}
                    </Fragment>
                );
            })}
        </>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p className="px-4.5 py-2.5 font-mono text-[10px] tracking-[1.5px] text-dim">{children}</p>
    );
}

function SubscribeButton() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const { subscribe } = useSubscriptions();
    const toast = useToast();

    const handleSubscribe = async () => {
        const trimmed = topic.trim();

        if (!trimmed) {
            return;
        }

        setLoading(true);

        try {
            await subscribe(trimmed);

            setTopic('');
            setOpen(false);
        } catch (error) {
            toast(apiErrorMessage(error, 'Could not subscribe to this topic'), 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 font-mono text-[12px] font-semibold text-bg hover:bg-accent-dim"
                onClick={() => setOpen(true)}
            >
                <Plus size={12} /> subscribe
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <input
                autoFocus
                className="w-[180px] rounded-md border border-line bg-elev px-2.5 py-1.5 font-mono text-[12px] text-fg outline-none placeholder:text-dim"
                maxLength={TOPIC_NAME_MAX_LENGTH}
                onChange={(event) => setTopic(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSubscribe();
                    if (event.key === 'Escape') setOpen(false);
                }}
                placeholder="topic/name"
                value={topic}
            />

            <button
                className="rounded-md bg-accent px-2.5 py-1.5 font-mono text-[12px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-50"
                disabled={!topic.trim() || loading}
                onClick={handleSubscribe}
            >
                {loading ? '…' : 'add'}
            </button>

            <button
                className="rounded-md px-2 py-1.5 font-mono text-[12px] text-muted hover:text-fg"
                onClick={() => setOpen(false)}
            >
                esc
            </button>
        </div>
    );
}

function TimelineList({ messages, onSelect, selectedId }: SubListProps) {
    const nodes: ReactNode[] = [];
    let currentDay = '';

    messages.forEach((message, index) => {
        const day = dayLabel(message.createdAt);

        if (day !== currentDay) {
            currentDay = day;
            nodes.push(<TimelineDateLabel key={`day-${message.id}`}>{day}</TimelineDateLabel>);
        }

        const next = messages[index + 1];
        const isLast = !next || dayLabel(next.createdAt) !== currentDay;

        nodes.push(
            <TimelineRow
                active={message.id === selectedId}
                isLast={isLast}
                key={message.id}
                message={message}
                onClick={() => onSelect(message.id)}
            />,
        );
    });

    return <>{nodes}</>;
}
