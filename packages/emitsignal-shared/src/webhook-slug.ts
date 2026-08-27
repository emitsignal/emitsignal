export const WEBHOOK_SLUG_RANDOM_LENGTH = 16;

export const WEBHOOK_SLUG_REGEX = /^[a-z]{2}_[a-z0-9]{16}$/;

export const WEBHOOK_SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const WEBHOOK_SOURCE_PREFIX: Record<string, string> = {
    custom: 'cw',
    github: 'gh',
    grafana: 'gf',
    stripe: 'st',
    vercel: 'vc',
};

export function isValidWebhookSlug(slug: string, source?: string): boolean {
    if (!WEBHOOK_SLUG_REGEX.test(slug)) {
        return false;
    }

    return source === undefined || slug.startsWith(`${webhookSlugPrefix(source)}_`);
}

export function webhookSlugPrefix(source: string): string {
    return WEBHOOK_SOURCE_PREFIX[source] ?? 'cw';
}
