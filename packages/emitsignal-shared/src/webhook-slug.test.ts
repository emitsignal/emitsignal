import { describe, expect, it } from 'bun:test';

import { generateWebhookSlug, isValidWebhookSlug, webhookSlugPrefix } from './webhook-slug.ts';

describe('webhookSlugPrefix', () => {
    it('maps known sources', () => {
        expect(webhookSlugPrefix('stripe')).toBe('st');
        expect(webhookSlugPrefix('github')).toBe('gh');
    });

    it('falls back to the custom prefix', () => {
        expect(webhookSlugPrefix('whatever')).toBe('cw');
    });
});

describe('generateWebhookSlug', () => {
    it('produces a slug the validator accepts for that source', () => {
        const slug = generateWebhookSlug('stripe');

        expect(slug).toMatch(/^st_[a-z0-9]{16}$/);
        expect(isValidWebhookSlug(slug, 'stripe')).toBe(true);
    });

    it('does not repeat itself', () => {
        const slugs = new Set(Array.from({ length: 50 }, () => generateWebhookSlug('custom')));

        expect(slugs.size).toBe(50);
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
