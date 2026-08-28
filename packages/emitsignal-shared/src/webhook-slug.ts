import { isRandomToken, randomToken } from './random-token';

export const WEBHOOK_SLUG_RANDOM_LENGTH = 16;

export const WEBHOOK_SOURCE_PREFIX: Record<string, string> = {
    custom: 'cw',
    github: 'gh',
    grafana: 'gf',
    stripe: 'st',
    vercel: 'vc',
};

const PREFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const PREFIX_LENGTH = 2;

export function generateWebhookSlug(source: string): string {
    return `${webhookSlugPrefix(source)}_${randomToken(WEBHOOK_SLUG_RANDOM_LENGTH)}`;
}

export function isValidWebhookSlug(slug: string, source?: string): boolean {
    if (slug[PREFIX_LENGTH] !== '_') {
        return false;
    }

    const prefix = slug.slice(0, PREFIX_LENGTH);

    if (!isRandomToken(prefix, PREFIX_LENGTH, PREFIX_ALPHABET)) {
        return false;
    }

    if (!isRandomToken(slug.slice(PREFIX_LENGTH + 1), WEBHOOK_SLUG_RANDOM_LENGTH)) {
        return false;
    }

    return source === undefined || prefix === webhookSlugPrefix(source);
}

export function webhookSlugPrefix(source: string): string {
    return WEBHOOK_SOURCE_PREFIX[source] ?? 'cw';
}
