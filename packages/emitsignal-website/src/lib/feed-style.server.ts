import { getCookie } from '@tanstack/react-start/server';

import { FEED_STYLE_KEY, type FeedStyle, isFeedStyle } from '#/lib/feed-style';

/**
 * Reads the feed-style preference from the request cookie so the initial render
 * matches the persisted choice (no flash). Defaults to 'comfy'.
 */
export function getFeedStyle(): FeedStyle {
    const value = getCookie(FEED_STYLE_KEY);

    return isFeedStyle(value) ? value : 'comfy';
}
