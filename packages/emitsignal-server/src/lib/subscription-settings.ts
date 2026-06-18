export type ListenSince = 'always' | 'subscription_date';

export interface SubscriptionSettings {
    listenSince: ListenSince;
}

export const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
    listenSince: 'subscription_date',
};

const LISTEN_SINCE_VALUES: ListenSince[] = ['always', 'subscription_date'];

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

    const candidate = (parsed as Record<string, unknown>).listenSince;

    return {
        listenSince: isListenSince(candidate)
            ? candidate
            : DEFAULT_SUBSCRIPTION_SETTINGS.listenSince,
    };
}

/**
 * Merges a partial settings object over the defaults and serializes it to the
 * canonical JSON string stored on the subscription.
 */
export function serializeSubscriptionSettings(partial: Partial<SubscriptionSettings>): string {
    const merged: SubscriptionSettings = {
        listenSince: isListenSince(partial.listenSince)
            ? partial.listenSince
            : DEFAULT_SUBSCRIPTION_SETTINGS.listenSince,
    };

    return JSON.stringify(merged);
}

function isListenSince(value: unknown): value is ListenSince {
    return typeof value === 'string' && LISTEN_SINCE_VALUES.includes(value as ListenSince);
}
