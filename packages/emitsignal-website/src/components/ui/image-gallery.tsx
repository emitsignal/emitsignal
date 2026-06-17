import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { MediaRef } from '#/lib/api';

interface ImageGalleryProps {
    images: MediaRef[];
    onClose: () => void;
    startIndex?: number;
}

export function ImageGallery({ images, onClose, startIndex = 0 }: ImageGalleryProps) {
    const [index, setIndex] = useState(startIndex);

    const total = images.length;
    const hasMultiple = total > 1;

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'ArrowRight') {
                setIndex((current) => (current + 1) % total);
            } else if (event.key === 'ArrowLeft') {
                setIndex((current) => (current - 1 + total) % total);
            }
        };

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, total]);

    if (total === 0) {
        return null;
    }

    const current = images[index];
    const goPrevious = () => setIndex((value) => (value - 1 + total) % total);
    const goNext = () => setIndex((value) => (value + 1) % total);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.9)' }}
        >
            <div
                className="flex items-center justify-between px-5 py-3.5"
                onClick={(event) => event.stopPropagation()}
            >
                <span className="min-w-0 truncate font-mono text-[12px] text-muted">
                    {current.title ?? current.href}
                    {hasMultiple ? (
                        <span className="ml-2 text-dim">
                            {index + 1} / {total}
                        </span>
                    ) : null}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        aria-label="Download image"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elev text-muted hover:text-fg"
                        onClick={() => void downloadImage(current)}
                        title="Download"
                    >
                        <Download size={15} />
                    </button>

                    <a
                        aria-label="Open image in new tab"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elev text-muted hover:text-fg"
                        href={current.href}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Open in new tab"
                    >
                        <ExternalLink size={15} />
                    </a>

                    <button
                        aria-label="Close gallery"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elev text-muted hover:text-fg"
                        onClick={onClose}
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div
                className="flex min-h-0 flex-1 items-center justify-center px-5 pb-6"
                onClick={(event) => event.stopPropagation()}
            >
                {hasMultiple && (
                    <button
                        aria-label="Previous image"
                        className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line bg-elev text-muted hover:text-fg"
                        onClick={goPrevious}
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                <img
                    alt={current.title ?? 'image'}
                    className="max-h-full max-w-full rounded-lg object-contain"
                    draggable={false}
                    src={current.href}
                />

                {hasMultiple && (
                    <button
                        aria-label="Next image"
                        className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line bg-elev text-muted hover:text-fg"
                        onClick={goNext}
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}

async function downloadImage(image: MediaRef): Promise<void> {
    const filename = fileNameFor(image);

    try {
        const response = await fetch(image.href);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        triggerDownload(objectUrl, filename);
        URL.revokeObjectURL(objectUrl);
    } catch {
        // Cross-origin without CORS headers — fall back to opening the file.
        window.open(image.href, '_blank', 'noopener,noreferrer');
    }
}

function fileNameFor(image: MediaRef): string {
    if (image.title) {
        return image.title;
    }

    try {
        const { pathname } = new URL(image.href);
        const last = pathname.split('/').filter(Boolean).pop();

        return last ?? 'image';
    } catch {
        return 'image';
    }
}

function triggerDownload(url: string, filename: string): void {
    const anchor = document.createElement('a');

    anchor.download = filename;
    anchor.href = url;

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();
}
