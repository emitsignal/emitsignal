import { externalUrlLabel, safeExternalUrl } from '@emitsignal/shared/url';
import { ExternalLink } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import type { MediaRef, Message } from '#/lib/api';

import { ImageGallery } from '#/components/ui/image-gallery';
import { LinkWarningDialog } from '#/components/ui/link-warning-dialog';
import { Pill } from '#/components/ui/pill';
import { SubHeading } from '#/components/ui/sub-head';

interface MessageArticleProps {
    /** Rendered alongside the message's own actions; the dashboard passes its Acknowledge button. */
    acknowledgeSlot?: ReactNode;
    message: Message;
}

/**
 * The parts of a message that read the same wherever it is shown — the dashboard
 * preview and the public share page. Each surface keeps its own header (priority
 * line, title, byline) because those differ in scale and content.
 */
export function MessageArticle({ acknowledgeSlot, message }: MessageArticleProps) {
    const [galleryIndex, setGalleryIndex] = useState<null | number>(null);
    const [pendingLink, setPendingLink] = useState<MediaRef | null>(null);

    // Banner first, then inline images — a single gallery the lightbox traverses.
    const galleryImages: MediaRef[] = [
        ...(message.bannerImage ? [message.bannerImage] : []),
        ...message.inlineImages,
    ];

    const bannerOffset = message.bannerImage ? 1 : 0;
    const otherActions = message.actions.filter((action) => action.type !== 'acknowledge');

    return (
        <>
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

            {(acknowledgeSlot || otherActions.length > 0) && (
                <div className="mb-6.5 flex gap-2">
                    {acknowledgeSlot}

                    {otherActions.map((action, index) => {
                        // Only render a clickable link for safe http(s) URLs;
                        // never emit an anchor for a javascript:/data: scheme.
                        const safeHref = safeExternalUrl(action.url);
                        const host = externalUrlLabel(safeHref);

                        return safeHref ? (
                            <a
                                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] font-semibold text-fg no-underline hover:border-faint hover:bg-elev-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                href={safeHref}
                                key={index}
                                rel="noopener noreferrer"
                                target="_blank"
                                title={`Opens ${safeHref} in a new tab. This link is not verified by EmitSignal.`}
                            >
                                {action.label ?? action.type}

                                {host && (
                                    <span className="font-mono text-[11px] font-normal text-dim">
                                        {host}
                                    </span>
                                )}

                                <ExternalLink className="text-dim" size={12} />
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

            {galleryIndex !== null && (
                <ImageGallery
                    images={galleryImages}
                    onClose={() => setGalleryIndex(null)}
                    startIndex={galleryIndex}
                />
            )}

            <LinkWarningDialog link={pendingLink} onClose={() => setPendingLink(null)} />
        </>
    );
}
