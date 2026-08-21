import { publishUrl } from '@emitsignal/shared/topic';
import { safeExternalUrl } from '@emitsignal/shared/url';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

import type { MediaRef, Message } from '#/lib/api';

import { CodeBlock } from '#/components/ui/code-block';
import { Dot } from '#/components/ui/dot';
import { ImageGallery } from '#/components/ui/image-gallery';
import { LinkWarningDialog } from '#/components/ui/link-warning-dialog';
import { Pill } from '#/components/ui/pill';
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

export function InboxPreview({ message }: { message: Message | null }) {
    const { sections } = useDebugSections();
    const [galleryIndex, setGalleryIndex] = useState<null | number>(null);
    const [pendingLink, setPendingLink] = useState<MediaRef | null>(null);

    if (!message) {
        return (
            <div className="flex min-w-0 flex-1 items-center justify-center p-7 font-mono text-[12px] text-dim">
                select a message to preview
            </div>
        );
    }

    const channel = message.topicName ?? message.topicId;
    const hasAcknowledge = message.actions.some((action) => action.type === 'acknowledge');
    const otherActions = message.actions.filter((action) => action.type !== 'acknowledge');

    // Banner first, then inline images — a single gallery the lightbox traverses.
    const galleryImages: MediaRef[] = [
        ...(message.bannerImage ? [message.bannerImage] : []),
        ...message.inlineImages,
    ];

    const bannerOffset = message.bannerImage ? 1 : 0;

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

    const curlCommand = `curl -X POST ${publishUrl(PUBLISH_BASE_URL, channel)} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
      actions: message.actions.length ? message.actions : undefined,
      body: message.body,
      priority: message.priority,
      tags: message.tags,
      title: message.title,
  })}'`;

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
            </div>

            <h2 className="m-0 mb-2.5 text-[26px] font-semibold tracking-[-0.6px]">
                {message.title}
            </h2>
            <p className="m-0 mb-4.5 whitespace-pre-wrap text-[14px] leading-[1.5] text-muted">
                {message.body}
            </p>

            {message.bannerImage && (
                <button
                    className="mb-4.5 block w-full cursor-pointer"
                    onClick={() => setGalleryIndex(0)}
                    title={message.bannerImage.title}
                    type="button"
                >
                    <img
                        alt={message.bannerImage.title ?? 'banner'}
                        className="max-h-[280px] w-full rounded-lg border border-line object-cover"
                        draggable={false}
                        src={message.bannerImage.href}
                    />
                </button>
            )}

            {message.tags.length > 0 && (
                <div className="mb-4.5 flex flex-wrap gap-1.5">
                    {message.tags.map((tag) => (
                        <Pill
                            key={tag}
                            tone={tag === 'error' || tag === 'alert' ? 'danger' : 'accent'}
                        >
                            {tag}
                        </Pill>
                    ))}
                </div>
            )}

            {(hasAcknowledge || otherActions.length > 0) && (
                <div className="mb-6.5 flex gap-2">
                    {hasAcknowledge && (
                        <button className="rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-bg hover:bg-accent-dim">
                            Acknowledge
                        </button>
                    )}

                    {otherActions.map((action, index) => {
                        // Only render a clickable link for safe http(s) URLs;
                        // never emit an anchor for a javascript:/data: scheme.
                        const safeHref = safeExternalUrl(action.url);

                        return safeHref ? (
                            <a
                                className="rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] text-fg no-underline hover:bg-elev-2"
                                href={safeHref}
                                key={index}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {action.label ?? action.type}
                            </a>
                        ) : (
                            <span
                                className="cursor-not-allowed rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] text-dim"
                                key={index}
                                title="This action link was blocked (unsupported URL scheme)."
                            >
                                {action.label ?? action.type}
                            </span>
                        );
                    })}
                </div>
            )}

            {message.inlineAttachments.length > 0 && (
                <div className="mb-4.5">
                    <SubHeading>ATTACHMENTS</SubHeading>
                    <div className="flex flex-col gap-1.5">
                        {message.inlineAttachments.map((attachment, index) => (
                            <button
                                className="flex w-full items-center gap-2 rounded-md border border-line bg-elev px-3 py-2 text-left text-[12.5px] text-fg hover:bg-elev-2"
                                key={index}
                                onClick={() => setPendingLink(attachment)}
                                type="button"
                            >
                                <ExternalLink className="flex-shrink-0 text-dim" size={13} />
                                <span className="truncate">
                                    {attachment.title ?? attachment.href}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {message.inlineImages.length > 0 && (
                <div className="mb-4.5">
                    <SubHeading>IMAGES</SubHeading>
                    <div className="flex flex-wrap gap-2">
                        {message.inlineImages.map((image, index) => (
                            <button
                                className="cursor-pointer"
                                key={index}
                                onClick={() => setGalleryIndex(bannerOffset + index)}
                                title={image.title}
                                type="button"
                            >
                                <img
                                    alt={image.title ?? `image ${index + 1}`}
                                    className="h-20 w-20 rounded-md border border-line object-cover"
                                    draggable={false}
                                    src={image.href}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {sections.showPayload ? <CodeBlock code={payloadJson} label="PAYLOAD" /> : null}

            {sections.showCurl ? <CodeBlock code={curlCommand} label="REPRODUCE · CURL" /> : null}

            {sections.showDelivery ? (
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
            ) : null}

            {galleryIndex !== null && (
                <ImageGallery
                    images={galleryImages}
                    onClose={() => setGalleryIndex(null)}
                    startIndex={galleryIndex}
                />
            )}

            <LinkWarningDialog link={pendingLink} onClose={() => setPendingLink(null)} />
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
