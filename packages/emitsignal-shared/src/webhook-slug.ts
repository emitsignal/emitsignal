// The slug is reserved in the browser so the endpoint URL is known before the webhook is
// saved: providers like Stripe need the URL to issue a signing secret, and the secret is
// part of the same form. Server and client share this module so the format cannot drift.

export const WEBHOOK_SLUG_RANDOM_LENGTH = 16;

export const WEBHOOK_SLUG_REGEX = /^[a-z]{2}_[a-z0-9]{16}$/;

export const WEBHOOK_SOURCE_PREFIX: Record<string, string> = {
    custom: 'cw',
    github: 'gh',
    grafana: 'gf',
    stripe: 'st',
    vercel: 'vc',
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateWebhookSlug(source: string): string {
    const bytes = crypto.getRandomValues(new Uint8Array(WEBHOOK_SLUG_RANDOM_LENGTH));
    let suffix = '';

    for (const byte of bytes) {
        suffix += ALPHABET[byte % ALPHABET.length];
    }

    return `${webhookSlugPrefix(source)}_${suffix}`;
}

export function isValidWebhookSlug(slug: string, source?: string): boolean {
    if (!WEBHOOK_SLUG_REGEX.test(slug)) {
        return false;
    }

    return source === undefined || slug.startsWith(`${webhookSlugPrefix(source)}_`);
}

export function webhookSlugPrefix(source: string): string {
    return WEBHOOK_SOURCE_PREFIX[source] ?? 'cw';
}
