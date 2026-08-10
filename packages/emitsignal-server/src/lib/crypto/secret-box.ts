import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { environment } from '#/schema/environment';

// Webhook signing secrets cannot be hashed the way passwords are: verifying an
// HMAC requires the original key material back.

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit nonce, the size GCM is specified for
const KEY_BYTES = 32;
const VERSION = 'v1';

const key = deriveKey();

export function decryptSecret(payload: string): string {
    const parts = payload.split('.');

    if (parts.length !== 4 || parts[0] !== VERSION) {
        throw new Error('secret_box: unrecognized ciphertext format');
    }

    const [, initializationVector, ciphertext, authenticationTag] = parts;

    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(initializationVector, 'base64'));

    decipher.setAuthTag(Buffer.from(authenticationTag, 'base64'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

export function encryptSecret(plaintext: string): string {
    const initializationVector = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, initializationVector);

    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    return [
        VERSION,
        initializationVector.toString('base64'),
        ciphertext.toString('base64'),
        cipher.getAuthTag().toString('base64'),
    ].join('.');
}

function deriveKey(): Buffer {
    if (environment.WEBHOOK_SECRET_KEY) {
        const decoded = Buffer.from(environment.WEBHOOK_SECRET_KEY, 'base64');

        if (decoded.length !== KEY_BYTES) {
            throw new Error(
                'WEBHOOK_SECRET_KEY must decode to 32 bytes (e.g. `openssl rand -base64 32`).',
            );
        }

        return decoded;
    }

    // BETTER_AUTH_SECRET is already validated as strong in production.
    return scryptSync(environment.BETTER_AUTH_SECRET, 'emitsignal-webhook-secret', KEY_BYTES);
}
