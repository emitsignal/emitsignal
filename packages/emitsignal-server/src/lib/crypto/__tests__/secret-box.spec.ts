import { describe, expect, it } from 'bun:test';

import { decryptSecret, encryptSecret } from '#/lib/crypto/secret-box';

const PLAINTEXT = 'fixture-plaintext-not-a-credential';

describe('secret box', () => {
    it('round-trips a secret', () => {
        expect(decryptSecret(encryptSecret(PLAINTEXT))).toBe(PLAINTEXT);
    });

    it('never stores the plaintext in the ciphertext', () => {
        expect(encryptSecret(PLAINTEXT)).not.toContain(PLAINTEXT);
    });

    it('produces a different ciphertext each time (fresh nonce)', () => {
        expect(encryptSecret(PLAINTEXT)).not.toBe(encryptSecret(PLAINTEXT));
    });

    it('round-trips unicode and empty strings', () => {
        expect(decryptSecret(encryptSecret('sécret—☃'))).toBe('sécret—☃');
        expect(decryptSecret(encryptSecret(''))).toBe('');
    });

    it('rejects a tampered ciphertext rather than returning garbage', () => {
        const [version, initializationVector, ciphertext, authenticationTag] =
            encryptSecret(PLAINTEXT).split('.');
        const flipped = Buffer.from(ciphertext as string, 'base64');

        flipped[0] = (flipped[0] ?? 0) ^ 0xff;

        expect(() =>
            decryptSecret(
                [version, initializationVector, flipped.toString('base64'), authenticationTag].join(
                    '.',
                ),
            ),
        ).toThrow();
    });

    it('rejects a tampered authentication tag', () => {
        const parts = encryptSecret(PLAINTEXT).split('.');

        parts[3] = Buffer.alloc(16).toString('base64');

        expect(() => decryptSecret(parts.join('.'))).toThrow();
    });

    it('rejects an unrecognized format', () => {
        expect(() => decryptSecret('not-a-ciphertext')).toThrow(/unrecognized/);
        expect(() => decryptSecret('v2.a.b.c')).toThrow(/unrecognized/);
    });
});
