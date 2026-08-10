import { createHmac, timingSafeEqual } from 'node:crypto';

// Every provider signs the raw request bytes, so callers must pass the untouched
// body text — a re-serialized JSON object will not reproduce the signature.

export type VerificationFailureReason =
    | 'bad_config'
    | 'bad_signature'
    | 'missing_signature'
    | 'stale_timestamp';

export interface VerificationInput {
    config: null | string;
    headers: Record<string, string | undefined>;
    rawBody: string;
    scheme: VerificationScheme;
    secret: string;
}

export type VerificationResult = { ok: false; reason: VerificationFailureReason } | { ok: true };

export type VerificationScheme = 'github' | 'hmac' | 'none' | 'stripe' | 'svix' | 'token';

export const VERIFICATION_SCHEMES: VerificationScheme[] = [
    'none',
    'github',
    'stripe',
    'svix',
    'hmac',
    'token',
];

// Bounds replay of a captured delivery. Matches Stripe's and Svix's tolerance.
export const MAX_SIGNATURE_SKEW_SECONDS = 300;

export interface VerificationConfig {
    algorithm: 'sha1' | 'sha256' | 'sha512';
    encoding: 'base64' | 'hex';
    header: string;
    prefix: string;
}

export function isVerificationScheme(value: string): value is VerificationScheme {
    return VERIFICATION_SCHEMES.includes(value as VerificationScheme);
}

export function parseVerificationConfig(raw: null | string): null | VerificationConfig {
    if (!raw) {
        return null;
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== 'object') {
        return null;
    }

    const candidate = parsed as Record<string, unknown>;
    const header = typeof candidate.header === 'string' ? candidate.header.trim() : '';

    if (!header) {
        return null;
    }

    const algorithm = candidate.algorithm ?? 'sha256';
    const encoding = candidate.encoding ?? 'hex';

    if (algorithm !== 'sha1' && algorithm !== 'sha256' && algorithm !== 'sha512') {
        return null;
    }

    if (encoding !== 'base64' && encoding !== 'hex') {
        return null;
    }

    return {
        algorithm,
        encoding,
        header: header.toLowerCase(),
        prefix: typeof candidate.prefix === 'string' ? candidate.prefix : '',
    };
}

export function schemeNeedsConfig(scheme: VerificationScheme): boolean {
    return scheme === 'hmac' || scheme === 'token';
}

export function verifyWebhookSignature(input: VerificationInput): VerificationResult {
    if (input.scheme === 'none') {
        return { ok: true };
    }

    if (!input.secret) {
        return { ok: false, reason: 'bad_config' };
    }

    switch (input.scheme) {
        case 'github':
            return verifyGithub(input);
        case 'hmac':
            return verifyGenericHmac(input);
        case 'stripe':
            return verifyStripe(input);
        case 'svix':
            return verifySvix(input);
        case 'token':
            return verifyToken(input);
        default:
            return { ok: false, reason: 'bad_config' };
    }
}

function matches(received: string, expected: string): VerificationResult {
    return timingSafeEqualString(received.trim(), expected)
        ? { ok: true }
        : { ok: false, reason: 'bad_signature' };
}

function matchesAny(received: string[], expected: string): VerificationResult {
    // Deliberately does not short-circuit: the comparison count stays independent
    // of which entry matched.
    let found = false;

    for (const candidate of received) {
        if (timingSafeEqualString(candidate.trim(), expected)) {
            found = true;
        }
    }

    return found ? { ok: true } : { ok: false, reason: 'bad_signature' };
}

function timingSafeEqualString(received: string, expected: string): boolean {
    const receivedBytes = Buffer.from(received, 'utf8');
    const expectedBytes = Buffer.from(expected, 'utf8');

    // timingSafeEqual throws on length mismatch; a signature's length is not
    // secret, so the early return leaks nothing.
    if (receivedBytes.length !== expectedBytes.length) {
        return false;
    }

    return timingSafeEqual(receivedBytes, expectedBytes);
}

// User-configured HMAC over the raw body, for providers we do not special-case.
function verifyGenericHmac({
    config,
    headers,
    rawBody,
    secret,
}: VerificationInput): VerificationResult {
    const parsed = parseVerificationConfig(config);

    if (!parsed) {
        return { ok: false, reason: 'bad_config' };
    }

    const header = headers[parsed.header];

    if (!header) {
        return { ok: false, reason: 'missing_signature' };
    }

    if (parsed.prefix && !header.startsWith(parsed.prefix)) {
        return { ok: false, reason: 'bad_signature' };
    }

    const expected = createHmac(parsed.algorithm, secret)
        .update(rawBody, 'utf8')
        .digest(parsed.encoding);

    return matches(header.slice(parsed.prefix.length), expected);
}

// GitHub: X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the raw body>.
function verifyGithub({ headers, rawBody, secret }: VerificationInput): VerificationResult {
    const header = headers['x-hub-signature-256'];

    if (!header) {
        return { ok: false, reason: 'missing_signature' };
    }

    if (!header.startsWith('sha256=')) {
        return { ok: false, reason: 'bad_signature' };
    }

    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

    return matches(header.slice('sha256='.length), expected);
}

// Stripe: Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>], signed over `${t}.${raw}`.
// Multiple v1 entries appear during a secret rotation — any match is enough.
function verifyStripe({ headers, rawBody, secret }: VerificationInput): VerificationResult {
    const header = headers['stripe-signature'];

    if (!header) {
        return { ok: false, reason: 'missing_signature' };
    }

    const signatures: string[] = [];
    let timestamp = '';

    for (const part of header.split(',')) {
        const separator = part.indexOf('=');

        if (separator === -1) {
            continue;
        }

        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();

        if (key === 't') {
            timestamp = value;
        }

        if (key === 'v1') {
            signatures.push(value);
        }
    }

    if (!timestamp || signatures.length === 0) {
        return { ok: false, reason: 'missing_signature' };
    }

    if (!withinSkew(timestamp)) {
        return { ok: false, reason: 'stale_timestamp' };
    }

    const expected = createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`, 'utf8')
        .digest('hex');

    return matchesAny(signatures, expected);
}

// Svix (Resend, Clerk, ...): svix-signature is a space-separated list of
// `v1,<base64>` entries over `${svix-id}.${svix-timestamp}.${raw}`. The secret
// is `whsec_<base64 key bytes>`, and the key is the decoded bytes, not the text.
function verifySvix({ headers, rawBody, secret }: VerificationInput): VerificationResult {
    const identifier = headers['svix-id'];
    const timestamp = headers['svix-timestamp'];
    const header = headers['svix-signature'];

    if (!identifier || !timestamp || !header) {
        return { ok: false, reason: 'missing_signature' };
    }

    if (!withinSkew(timestamp)) {
        return { ok: false, reason: 'stale_timestamp' };
    }

    const key = Buffer.from(
        secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret,
        'base64',
    );

    if (key.length === 0) {
        return { ok: false, reason: 'bad_config' };
    }

    const expected = createHmac('sha256', key)
        .update(`${identifier}.${timestamp}.${rawBody}`, 'utf8')
        .digest('base64');

    const signatures: string[] = [];

    for (const entry of header.split(' ')) {
        const [version, signature] = entry.split(',');

        if (version === 'v1' && signature) {
            signatures.push(signature);
        }
    }

    if (signatures.length === 0) {
        return { ok: false, reason: 'missing_signature' };
    }

    return matchesAny(signatures, expected);
}

// Shared-token schemes: the header carries the secret itself, not a signature.
function verifyToken({ config, headers, secret }: VerificationInput): VerificationResult {
    const parsed = parseVerificationConfig(config);

    if (!parsed) {
        return { ok: false, reason: 'bad_config' };
    }

    const header = headers[parsed.header];

    if (!header) {
        return { ok: false, reason: 'missing_signature' };
    }

    return matches(parsed.prefix ? header.slice(parsed.prefix.length) : header, secret);
}

function withinSkew(timestamp: string): boolean {
    const seconds = Number(timestamp);

    if (!Number.isFinite(seconds)) {
        return false;
    }

    return Math.abs(Math.floor(Date.now() / 1000) - seconds) <= MAX_SIGNATURE_SKEW_SECONDS;
}
