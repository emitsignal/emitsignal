export type ListenSince = 'always' | 'subscription_date';

export interface SubscriptionSettings {
    description?: string;
    listenSince: ListenSince;
}

export const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
    listenSince: 'subscription_date',
};

const LISTEN_SINCE_VALUES: ListenSince[] = ['always', 'subscription_date'];

export const SUBSCRIPTION_DESCRIPTION_MAX_LENGTH = 280;

/**
 * Parses the stored JSON settings string, falling back to defaults for any
 * missing or invalid keys. Never throws — malformed input yields the defaults.
 */
export function parseSubscriptionSettings(raw: string): SubscriptionSettings {
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ...DEFAULT_SUBSCRIPTION_SETTINGS };
    }

    if (typeof parsed !== 'object' || parsed === null) {
        return { ...DEFAULT_SUBSCRIPTION_SETTINGS };
    }

    const record = parsed as Record<string, unknown>;
    const listenSince = isListenSince(record.listenSince)
        ? record.listenSince
        : DEFAULT_SUBSCRIPTION_SETTINGS.listenSince;
    const description = normalizeDescription(record.description);

    return description === undefined ? { listenSince } : { description, listenSince };
}

/**
 * Merges a partial settings object over the defaults and serializes it to the
 * canonical JSON string stored on the subscription. An empty/whitespace
 * description is dropped so we never persist a blank override.
 */
export function serializeSubscriptionSettings(partial: Partial<SubscriptionSettings>): string {
    const merged: SubscriptionSettings = {
        listenSince: isListenSince(partial.listenSince)
            ? partial.listenSince
            : DEFAULT_SUBSCRIPTION_SETTINGS.listenSince,
    };

    const description = normalizeDescription(partial.description);

    if (description !== undefined) {
        merged.description = description;
    }

    return JSON.stringify(merged);
}

function isListenSince(value: unknown): value is ListenSince {
    return typeof value === 'string' && LISTEN_SINCE_VALUES.includes(value as ListenSince);
}

function normalizeDescription(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
        return undefined;
    }

    return trimmed.slice(0, SUBSCRIPTION_DESCRIPTION_MAX_LENGTH);
}
