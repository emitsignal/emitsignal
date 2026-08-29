import { createHmac } from 'node:crypto';

const DEV_OG = 'emitsignal-dev-og-secret';

export function ogSignature(parameters: URLSearchParams): string {
    // `||`, not `??`: docker compose resolves an unset variable to an empty
    // string, which would otherwise be used as the HMAC key.
    return createHmac('sha256', process.env.OG_SIGNING_SECRET || DEV_OG)
        .update(canonicalQuery(parameters))
        .digest('hex')
        .slice(0, 16);
}

export function signedOgUrl(siteUrl: string, parameters: Record<string, string>): string {
    const query = new URLSearchParams(parameters);
    query.sort();
    query.set('sig', ogSignature(query));

    return `${siteUrl}/api/og?${query.toString()}`;
}

export function verifyOgSignature(parameters: URLSearchParams): boolean {
    return constantTimeEqual(parameters.get('sig') ?? '', ogSignature(parameters));
}

/**
 * Params are sorted so the signer and the verifier always hash the same string,
 * regardless of the order they were appended in.
 */
function canonicalQuery(parameters: URLSearchParams): string {
    const unsigned = new URLSearchParams(parameters);
    unsigned.delete('sig');
    unsigned.sort();

    return unsigned.toString();
}

function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let diff = 0;

    for (let index = 0; index < a.length; index++) {
        diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
    }

    return diff === 0;
}
