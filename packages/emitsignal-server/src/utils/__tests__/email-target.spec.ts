import { describe, expect, it } from 'bun:test';

import { parseEmailTarget } from '#/utils/email-target';

describe('parseEmailTarget', () => {
    it('treats the ntfy self tokens as the account address', () => {
        for (const token of ['1', 'true', 'yes', 'YES', ' True ']) {
            expect(parseEmailTarget(token)).toEqual({ kind: 'self' });
        }
    });

    it('accepts a single address and normalizes its case', () => {
        expect(parseEmailTarget(' you@example.com ')).toEqual({
            address: 'you@example.com',
            kind: 'address',
        });
    });

    it('rejects more than one address', () => {
        for (const raw of ['a@b.com,c@d.com', 'a@b.com; c@d.com', 'a@b.com c@d.com']) {
            expect(parseEmailTarget(raw)).toEqual({
                error: 'only one email address is supported',
            });
        }
    });

    it('rejects an empty value', () => {
        expect(parseEmailTarget('   ')).toEqual({ error: 'an email address is required' });
    });

    it('rejects malformed addresses', () => {
        for (const raw of ['nope', 'a@b', '@example.com', 'phil@', 'phil@example.']) {
            expect(parseEmailTarget(raw)).toEqual({ error: 'not a valid email address' });
        }
    });

    it('rejects an address longer than 254 characters', () => {
        const raw = `${'a'.repeat(250)}@example.com`;

        expect(parseEmailTarget(raw)).toEqual({
            error: 'an email address cannot exceed 254 characters',
        });
    });
});
