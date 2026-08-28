import type { AccessMode } from './api';

import { isRandomToken, randomToken } from './random-token';

export interface ShareRefusal {
    accessMode: AccessMode;
    topicName: string;
}

export const SHARE_ID_LENGTH = 8;

export function generateShareId(): string {
    return randomToken(SHARE_ID_LENGTH);
}

export function isValidShareId(value: string): boolean {
    return isRandomToken(value, SHARE_ID_LENGTH);
}

export function parseShareRefusal(error: unknown): null | ShareRefusal {
    if (!(error instanceof Error)) {
        return null;
    }

    const body = error.message.replace(/^409\s+/, '');

    if (body === error.message) {
        return null;
    }

    try {
        const parsed = JSON.parse(body) as { error?: string } & Partial<ShareRefusal>;

        if (parsed.error !== 'topic_not_public' || !parsed.accessMode || !parsed.topicName) {
            return null;
        }

        return { accessMode: parsed.accessMode, topicName: parsed.topicName };
    } catch {
        return null;
    }
}

export function shareUrl(siteUrl: string, shareId: string, includePayload = false): string {
    const base = `${siteUrl.replace(/\/$/, '')}/s/${shareId}`;

    return includePayload ? `${base}?payload=1` : base;
}
