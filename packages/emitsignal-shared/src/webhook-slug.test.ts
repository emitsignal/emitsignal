import { describe, expect, it } from 'bun:test';

import { isValidWebhookSlug, webhookSlugPrefix } from './webhook-slug.ts';

describe('webhookSlugPrefix', () => {
    it('maps known sources', () => {
        expect(webhookSlugPrefix('stripe')).toBe('st');
        expect(webhookSlugPrefix('github')).toBe('gh');
    });

    it('falls back to the custom prefix', () => {
        expect(webhookSlugPrefix('whatever')).toBe('cw');
    });
});

describe('isValidWebhookSlug', () => {
    it('rejects a malformed slug', () => {
        expect(isValidWebhookSlug('nope')).toBe(false);
        expect(isValidWebhookSlug('st_TOOSHORT')).toBe(false);
        expect(isValidWebhookSlug('st_abcdefghijklmnopq')).toBe(false);
        expect(isValidWebhookSlug('ST_abcdefghijklmnop')).toBe(false);
    });

    it('accepts a well-formed slug without a source', () => {
        expect(isValidWebhookSlug('st_abcdefghijklmnop')).toBe(true);
    });

    it('rejects a prefix that does not match the source', () => {
        expect(isValidWebhookSlug('gh_abcdefghijklmnop', 'stripe')).toBe(false);
    });
});
