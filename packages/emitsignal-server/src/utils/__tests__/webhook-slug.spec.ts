import { isValidWebhookSlug } from '@emitsignal/shared/webhook-slug';
import { describe, expect, it } from 'bun:test';

import { generateWebhookSlug } from '#/utils/webhook-slug';

describe('generateWebhookSlug', () => {
    it('produces a slug the validator accepts for that source', () => {
        const slug = generateWebhookSlug('stripe');

        expect(slug).toMatch(/^st_[a-z0-9]{16}$/);
        expect(isValidWebhookSlug(slug, 'stripe')).toBe(true);
    });

    it('falls back to the custom prefix for an unknown source', () => {
        expect(generateWebhookSlug('whatever')).toMatch(/^cw_[a-z0-9]{16}$/);
    });

    it('does not repeat itself', () => {
        const slugs = new Set(Array.from({ length: 50 }, () => generateWebhookSlug('custom')));

        expect(slugs.size).toBe(50);
    });
});
