import { describe, expect, it } from 'bun:test';

import { normalizeMediaInput, validateMessageMedia } from '#/lib/media-refs';

describe('normalizeMediaInput', () => {
    it('returns empty for null/undefined', () => {
        expect(normalizeMediaInput(undefined)).toEqual({ refs: [] });
        expect(normalizeMediaInput(null)).toEqual({ refs: [] });
    });

    it('accepts a bare URL string', () => {
        expect(normalizeMediaInput('https://example.com/a.png')).toEqual({
            refs: [{ href: 'https://example.com/a.png' }],
        });
    });

    it('accepts a {title, href} object', () => {
        expect(
            normalizeMediaInput({ href: 'https://example.com/a.png', title: 'Diagram' }),
        ).toEqual({ refs: [{ href: 'https://example.com/a.png', title: 'Diagram' }] });
    });

    it('accepts an array mixing strings and objects', () => {
        const result = normalizeMediaInput([
            'https://example.com/a.png',
            { href: 'https://example.com/b.png', title: 'B' },
        ]);

        expect(result).toEqual({
            refs: [
                { href: 'https://example.com/a.png' },
                { href: 'https://example.com/b.png', title: 'B' },
            ],
        });
    });

    it('drops empty titles', () => {
        expect(normalizeMediaInput({ href: 'https://example.com/a.png', title: '' })).toEqual({
            refs: [{ href: 'https://example.com/a.png' }],
        });
    });

    it('rejects non-http(s) and malformed urls', () => {
        expect('error' in normalizeMediaInput('not-a-url')).toBe(true);
        expect('error' in normalizeMediaInput('ftp://example.com/a.png')).toBe(true);
        expect('error' in normalizeMediaInput('javascript:alert(1)')).toBe(true);
    });

    it('rejects objects without a valid href', () => {
        expect('error' in normalizeMediaInput({ title: 'no href' })).toBe(true);
        expect('error' in normalizeMediaInput([42])).toBe(true);
    });
});

describe('validateMessageMedia', () => {
    const banner = 'https://example.com/banner.png';
    const inline = (count: number) =>
        Array.from({ length: count }, (_unused, index) => `https://example.com/${index}.png`);

    it('normalizes all three fields under the limit', () => {
        const result = validateMessageMedia(
            { bannerImage: banner, inlineAttachments: inline(2), inlineImages: inline(3) },
            3,
        );

        expect('error' in result).toBe(false);

        if ('error' in result) {
            return;
        }

        expect(result.bannerImage).toEqual({ href: banner });
        expect(result.inlineImages).toHaveLength(3);
        expect(result.inlineAttachments).toHaveLength(2);
    });

    it('rejects more than one banner', () => {
        const result = validateMessageMedia({ bannerImage: [banner, banner] }, 3);

        expect('error' in result && result.error).toContain('bannerImage');
    });

    it('enforces the per-array inline limit independently', () => {
        const overImages = validateMessageMedia({ inlineImages: inline(4) }, 3);
        const overAttachments = validateMessageMedia({ inlineAttachments: inline(4) }, 3);

        expect('error' in overImages && overImages.error).toContain('inlineImages');
        expect('error' in overAttachments && overAttachments.error).toContain('inlineAttachments');
    });

    it('allows each array up to the limit at the same time', () => {
        const result = validateMessageMedia(
            { inlineAttachments: inline(3), inlineImages: inline(3) },
            3,
        );

        expect('error' in result).toBe(false);
    });

    it('propagates invalid-url errors', () => {
        const result = validateMessageMedia({ inlineImages: ['nope'] }, 3);

        expect('error' in result && result.error).toContain('invalid url');
    });
});
