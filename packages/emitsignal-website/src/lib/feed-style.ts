export type FeedStyle = 'comfy' | 'priority' | 'timeline';

/** Cookie + storage key holding the user's feed-style preference. */
export const FEED_STYLE_KEY = '@emitsignal/feed-style';

export function isFeedStyle(value: unknown): value is FeedStyle {
    return value === 'comfy' || value === 'priority' || value === 'timeline';
}

/** Reads the feed-style cookie on the client (server uses feed-style.server.ts). */
export function readFeedStyleFromDocument(): FeedStyle {
    if (typeof document === 'undefined') {
        return 'comfy';
    }

    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');

        if (name === FEED_STYLE_KEY) {
            const value = rest.join('=');

            return isFeedStyle(value) ? value : 'comfy';
        }
    }

    return 'comfy';
}
