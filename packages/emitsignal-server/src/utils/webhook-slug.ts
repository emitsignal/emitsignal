import {
    WEBHOOK_SLUG_ALPHABET,
    WEBHOOK_SLUG_RANDOM_LENGTH,
    webhookSlugPrefix,
} from '@emitsignal/shared/webhook-slug';
import { randomBytes } from 'node:crypto';

export function generateWebhookSlug(source: string): string {
    const bytes = randomBytes(WEBHOOK_SLUG_RANDOM_LENGTH);
    let suffix = '';

    for (const byte of bytes) {
        suffix += WEBHOOK_SLUG_ALPHABET[byte % WEBHOOK_SLUG_ALPHABET.length];
    }

    return `${webhookSlugPrefix(source)}_${suffix}`;
}
