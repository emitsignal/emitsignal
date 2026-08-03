import type { MediaRef } from '@emitsignal/shared';

// Anonymous publishers may attach a single inline item per array, regardless of
// the free-plan limit that logged-in users get.
export const ANON_INLINE_MAX = 1;

export interface MediaInputs {
    bannerImage?: unknown;
    inlineAttachments?: unknown;
    inlineImages?: unknown;
}

export interface NormalizedMedia {
    bannerImage: MediaRef | null;
    inlineAttachments: MediaRef[];
    inlineImages: MediaRef[];
}

export function isValidHref(value: string): boolean {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

// Accepts a bare URL string, a {title, href} object, or an array mixing both,
// and returns the canonical MediaRef[] (empty for null/undefined).
export function normalizeMediaInput(input: unknown): { error: string } | { refs: MediaRef[] } {
    if (input === undefined || input === null) {
        return { refs: [] };
    }

    const items = Array.isArray(input) ? input : [input];
    const refs: MediaRef[] = [];

    for (const item of items) {
        const result = toMediaRef(item);

        if ('error' in result) {
            return result;
        }

        refs.push(result.ref);
    }

    return { refs };
}

// Reads the JSON string column back into a single ref. Lenient by design: stored
// rows are already trusted, so malformed data yields null rather than an error.
export function parseMediaRef(raw: null | string): MediaRef | null {
    const refs = parseMediaRefs(raw ?? '');

    return refs[0] ?? null;
}

export function parseMediaRefs(raw: string): MediaRef[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        return items
            .filter(
                (item: unknown): item is MediaRef =>
                    typeof item === 'object' &&
                    item !== null &&
                    typeof (item as MediaRef).href === 'string',
            )
            .map((item) => {
                const ref: MediaRef = { href: item.href };

                if (typeof item.title === 'string' && item.title) {
                    ref.title = item.title;
                }

                return ref;
            });
    } catch {
        return [];
    }
}

export function validateMessageMedia(
    input: MediaInputs,
    inlineMax: number,
): { error: string } | NormalizedMedia {
    const banner = normalizeMediaInput(input.bannerImage);

    if ('error' in banner) {
        return { error: `bannerImage: ${banner.error}` };
    }

    if (banner.refs.length > 1) {
        return { error: 'bannerImage: only one allowed' };
    }

    const inlineImages = normalizeMediaInput(input.inlineImages);

    if ('error' in inlineImages) {
        return { error: `inlineImages: ${inlineImages.error}` };
    }

    if (inlineImages.refs.length > inlineMax) {
        return { error: `inlineImages: max ${inlineMax} allowed` };
    }

    const inlineAttachments = normalizeMediaInput(input.inlineAttachments);

    if ('error' in inlineAttachments) {
        return { error: `inlineAttachments: ${inlineAttachments.error}` };
    }

    if (inlineAttachments.refs.length > inlineMax) {
        return { error: `inlineAttachments: max ${inlineMax} allowed` };
    }

    return {
        bannerImage: banner.refs[0] ?? null,
        inlineAttachments: inlineAttachments.refs,
        inlineImages: inlineImages.refs,
    };
}

function toMediaRef(item: unknown): { error: string } | { ref: MediaRef } {
    if (typeof item === 'string') {
        if (!isValidHref(item)) {
            return { error: `invalid url "${item}"` };
        }

        return { ref: { href: item } };
    }

    if (typeof item === 'object' && item !== null) {
        const record = item as Record<string, unknown>;
        const href = record.href;

        if (typeof href !== 'string' || !isValidHref(href)) {
            return { error: `invalid url "${String(href)}"` };
        }

        const ref: MediaRef = { href };

        if (typeof record.title === 'string' && record.title) {
            ref.title = record.title;
        }

        return { ref };
    }

    return { error: 'each item must be a url string or a {title, href} object' };
}
