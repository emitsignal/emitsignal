import { buildCurlExample } from '@emitsignal/shared/publish-example';

import type { Message } from '#/lib/api';

import { MessageArticle } from '#/components/app/inbox/message-article';
import { ShareButton } from '#/components/share/share-button';
import { CodeBlock } from '#/components/ui/code-block';
import { Dot } from '#/components/ui/dot';
import { SkeletonMessageDetail } from '#/components/ui/skeleton';
import { SubHeading } from '#/components/ui/sub-head';
import { useDebugSections } from '#/ctx/debug-sections';
import { PUBLISH_BASE_URL } from '#/lib/api';
import { relativeTime } from '#/lib/format';
import { priorityHex } from '#/lib/priority';

const PRIORITY_LABELS: Record<number, string> = {
    1: 'PRIORITY 1 · LOW',
    2: 'PRIORITY 2',
    3: 'PRIORITY 3 · NORMAL',
    4: 'PRIORITY 4 · HIGH',
    5: 'PRIORITY 5 · MAX',
};

interface InboxPreviewProps {
    loading?: boolean;
    message: Message | null;
    selectedId?: null | string;
}

export function InboxPreview({ loading = false, message, selectedId }: InboxPreviewProps) {
    const { sections } = useDebugSections();

    if (!message && loading && selectedId) {
        return <SkeletonMessageDetail />;
    }

    if (!message) {
        return (
            <div className="flex min-w-0 flex-1 items-center justify-center p-7 font-mono text-[12px] text-dim">
                select a message to preview
            </div>
        );
    }

    const channel = message.topicName ?? message.topicId;
    const hasAcknowledge = message.actions.some((action) => action.type === 'acknowledge');

    const payloadJson = JSON.stringify(
        {
            bannerImage: message.bannerImage,
            body: message.body,
            id: message.id,
            inlineAttachments: message.inlineAttachments,
            inlineImages: message.inlineImages,
            priority: message.priority,
            tags: message.tags,
            title: message.title,
            topicId: message.topicId,
            topicName: message.topicName,
        },
        null,
        2,
    );

    const curlCommand = buildCurlExample({
        baseUrl: PUBLISH_BASE_URL,
        message: {
            actions: message.actions,
            body: message.body,
            priority: message.priority,
            tags: message.tags,
            title: message.title,
        },
        topicName: channel,
    });

    return (
        <div className="min-w-0 flex-1 overflow-auto p-7">
            <div className="mb-3.5 flex items-center gap-2">
                <Dot level={message.priority} size={8} />

                <span
                    className="font-mono text-[11px] font-semibold uppercase tracking-[1.2px]"
                    style={{ color: priorityHex(message.priority) }}
                >
                    {PRIORITY_LABELS[message.priority] ?? `PRIORITY ${message.priority}`}
                </span>

                <span className="ml-auto font-mono text-[11px] text-dim">
                    {channel} · {relativeTime(message.createdAt)}
                </span>

                <ShareButton message={message} />
            </div>

            <h2 className="m-0 mb-2.5 text-[26px] font-semibold tracking-[-0.6px]">
                {message.title}
            </h2>

            <MessageArticle
                acknowledgeSlot={
                    hasAcknowledge && (
                        <button
                            className="rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-bg hover:bg-accent-dim"
                            type="button"
                        >
                            Acknowledge
                        </button>
                    )
                }
                message={message}
            />

            {sections.showCurl && <CodeBlock code={curlCommand} label="REPRODUCE · CURL" />}
            {sections.showPayload && <CodeBlock code={payloadJson} label="PAYLOAD" />}

            {sections.showDelivery && (
                <div className="mb-4.5">
                    <SubHeading>DELIVERY</SubHeading>
                    <div className="flex flex-col gap-1.5">
                        {[
                            { event: 'received', time: message.createdAt },
                            { event: `routed → ${channel}`, time: message.createdAt },
                            { event: 'push → fcm', time: message.createdAt + 1000 },
                            { event: 'delivered · this device', time: message.createdAt + 2000 },
                        ].map((step) => (
                            <div
                                className="flex items-baseline gap-2.5 font-mono text-[11px]"
                                key={step.event}
                            >
                                <span className="w-16 shrink-0 text-dim">
                                    {formatTime(step.time)}
                                </span>
                                <span className="w-3 shrink-0 text-success">✓</span>
                                <span className="text-muted">{step.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);

    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}
