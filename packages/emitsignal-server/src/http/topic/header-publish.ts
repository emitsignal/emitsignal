const PRIORITY_MAP: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    default: 3,
    high: 4,
    low: 2,
    max: 5,
    min: 1,
    none: 3,
    urgent: 5,
};

const DURATION_MULTIPLIERS: Record<string, number> = {
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
    w: 604800,
};

export function parsePublishHeaders(
    headers: Record<string, string | undefined>,
    rawBody: string,
): {
    actions?: unknown;
    bannerImage?: unknown;
    body: string;
    email?: string;
    inlineAttachments?: unknown;
    inlineImages?: unknown;
    priority: number;
    scheduledAt?: number;
    tags: string[];
    title: string;
} {
    const messageOverride = firstHeader(headers, 'x-message', 'message', 'm');
    const rawActions = firstHeader(headers, 'x-actions', 'actions');
    const rawBanner = firstHeader(headers, 'x-banner', 'banner');
    const rawInlineAttachments = firstHeader(headers, 'x-inline-attachments', 'inline-attachments');
    const rawInlineImages = firstHeader(headers, 'x-inline-images', 'inline-images');
    const rawEmail = firstHeader(headers, 'x-email', 'x-e-mail', 'email', 'e-mail', 'mail', 'e');
    const rawDelay = firstHeader(headers, 'x-delay', 'delay', 'x-at', 'at', 'x-in', 'in');
    const rawPriority = firstHeader(headers, 'x-priority', 'priority', 'prio', 'p');
    const rawTags = firstHeader(headers, 'x-tags', 'tags', 'ta');

    let actions: unknown;

    if (rawActions) {
        try {
            actions = JSON.parse(rawActions);
        } catch {
            // validateActions will reject non-array gracefully
            actions = rawActions;
        }
    }

    return {
        actions,
        bannerImage: rawBanner ? parseMediaHeader(rawBanner) : undefined,
        body: messageOverride || rawBody,
        email: rawEmail || undefined,
        inlineAttachments: rawInlineAttachments
            ? parseMediaHeader(rawInlineAttachments)
            : undefined,
        inlineImages: rawInlineImages ? parseMediaHeader(rawInlineImages) : undefined,
        priority: rawPriority ? parsePriority(rawPriority) : 3,
        scheduledAt: rawDelay ? parseDelay(rawDelay) : undefined,
        tags: rawTags ? parseHeaderTags(rawTags) : [],
        title: firstHeader(headers, 'x-title', 'title', 't'),
    };
}

function firstHeader(headers: Record<string, string | undefined>, ...keys: string[]): string {
    for (const key of keys) {
        const val = headers[key.toLowerCase()];

        if (val != null && val !== '') {
            return val;
        }
    }

    return '';
}

function parseDelay(raw: string): number | undefined {
    const now = Math.floor(Date.now() / 1000);

    const asInt = parseInt(raw, 10);

    if (!isNaN(asInt) && String(asInt) === raw.trim()) {
        return asInt >= now ? asInt : now + asInt;
    }

    const match = raw.trim().match(/^(\d+)\s*([smhdw])$/i);

    if (!match) {
        return undefined;
    }

    const multiplier = DURATION_MULTIPLIERS[match[2].toLowerCase()];

    return now + parseInt(match[1], 10) * multiplier;
}

function parseHeaderTags(raw: string): string[] {
    return raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

// Header media accepts JSON ([...] or {...}) or a comma-separated list of URLs.
// Returned raw; validateMessageMedia normalizes and enforces per-array limits.
function parseMediaHeader(raw: string): unknown {
    const trimmed = raw.trim();

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // fall through to comma handling
        }
    }

    if (trimmed.includes(',')) {
        return trimmed
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    }

    return trimmed;
}

function parsePriority(raw: string): number {
    return (
        PRIORITY_MAP[raw.trim().toLowerCase()] ??
        (Number.isInteger(Number(raw)) ? Math.min(5, Math.max(1, Number(raw))) : 3)
    );
}
