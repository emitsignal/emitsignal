import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { Message } from '#/lib/api';

import { NotificationRow } from '#/components/app/inbox/notif-row';
import { InboxPreview } from '#/components/app/inbox/preview';
import { Toolbar } from '#/components/app/toolbar';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useFeed } from '#/hooks/use-emit-signal';

export function InboxLayout({ selectedId }: { selectedId: null | string }) {
    const { loading, messages, subscriptions } = useFeed();
    const navigate = useNavigate();

    const channelCount = subscriptions.length;
    const subtitle = loading
        ? 'loading…'
        : `${messages.length} messages · ${channelCount} channels active`;

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
                    messages={messages}
                    onSelect={handleSelect}
                    selectedId={selectedId}
                />
                <InboxPreview message={selected} />
            </div>
        </>
    );
}

function NotificationList({
    messages,
    onSelect,
    selectedId,
}: {
    messages: Message[];
    onSelect: (id: string) => void;
    selectedId: null | string;
}) {
    if (messages.length === 0) {
        return (
            <div className="flex w-[380px] shrink-0 items-center justify-center border-r border-line p-4 font-mono text-[12px] text-dim">
                no messages yet — subscribe to a channel
            </div>
        );
    }

    const now = messages.slice(0, 2);
    const earlier = messages.slice(2);

    return (
        <div className="w-[380px] shrink-0 overflow-auto border-r border-line">
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
        </div>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p className="px-4.5 py-2.5 font-mono text-[10px] tracking-[1.5px] text-dim">{children}</p>
    );
}

function SubscribeButton() {
    const { subscribe } = useSubscriptions();
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        const trimmed = topic.trim();
        if (!trimmed) return;
        setLoading(true);
        try {
            await subscribe(trimmed);
            setTopic('');
            setOpen(false);
        } catch {
            // ignore
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
