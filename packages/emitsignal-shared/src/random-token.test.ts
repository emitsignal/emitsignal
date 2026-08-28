import { describe, expect, it } from 'bun:test';

import { isRandomToken, randomToken, TOKEN_ALPHABET } from './random-token.ts';

describe('randomToken', () => {
    it('returns exactly the requested length', () => {
        for (const length of [1, 8, 16, 64]) {
            expect(randomToken(length)).toHaveLength(length);
        }
    });

    it('only ever emits characters from the alphabet', () => {
        expect(isRandomToken(randomToken(256), 256)).toBe(true);
    });

    it('honours a custom alphabet', () => {
        expect(randomToken(32, 'ab')).toMatch(/^[ab]{32}$/);
    });

    it('does not repeat itself', () => {
        const tokens = new Set(Array.from({ length: 200 }, () => randomToken(8)));

        expect(tokens.size).toBe(200);
    });

    // Folding 256 bytes onto 36 characters with `%` would leave the first four
    // roughly 14% likelier than the rest; rejection sampling keeps them level.
    it('draws each character with roughly equal probability', () => {
        const counts = new Map<string, number>();

        for (const char of randomToken(36 * 2000)) {
            counts.set(char, (counts.get(char) ?? 0) + 1);
        }

        const expected = 2000;
        const tolerance = expected * 0.25;

        expect(counts.size).toBe(TOKEN_ALPHABET.length);

        for (const char of TOKEN_ALPHABET) {
            expect(Math.abs((counts.get(char) ?? 0) - expected)).toBeLessThan(tolerance);
        }
    });
});

describe('isRandomToken', () => {
    it('rejects the wrong length', () => {
        expect(isRandomToken('abcdefg', 8)).toBe(false);
        expect(isRandomToken('abcdefghi', 8)).toBe(false);
    });

    it('rejects characters outside the alphabet', () => {
        expect(isRandomToken('abcdefgH', 8)).toBe(false);
        expect(isRandomToken('abcdef-g', 8)).toBe(false);
        expect(isRandomToken('abcdef g', 8)).toBe(false);
    });

    it('accepts a well-formed token', () => {
        expect(isRandomToken('kx8f2a99', 8)).toBe(true);
    });

    it('rejects a character that is valid only in the default alphabet', () => {
        expect(isRandomToken('ab', 2, 'abcdefghijklmnopqrstuvwxyz')).toBe(true);
        expect(isRandomToken('a1', 2, 'abcdefghijklmnopqrstuvwxyz')).toBe(false);
    });
});
