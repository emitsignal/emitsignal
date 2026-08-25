export type EmailTarget = { address: string; kind: 'address' } | { kind: 'self' };

const SELF_TOKENS = new Set(['1', 'true', 'yes']);

// Deliberately permissive: the goal is to reject obvious junk and multi-recipient
// values before they reach the queue, not to re-implement RFC 5321.
const ADDRESS_PATTERN = /^[^\s@,;]+@[^\s@,;.]+(\.[^\s@,;.]+)+$/;

// RFC 5321 caps a reversible path at 254 characters; the route schema matches.
const MAX_ADDRESS_LENGTH = 254;

export function parseEmailTarget(raw: string): { error: string } | EmailTarget {
    const trimmed = raw.trim();

    if (trimmed === '') {
        return { error: 'an email address is required' };
    }

    if (SELF_TOKENS.has(trimmed.toLowerCase())) {
        return { kind: 'self' };
    }

    if (/[,;]/.test(trimmed) || /\s/.test(trimmed)) {
        return { error: 'only one email address is supported' };
    }

    if (trimmed.length > MAX_ADDRESS_LENGTH) {
        return { error: `an email address cannot exceed ${MAX_ADDRESS_LENGTH} characters` };
    }

    if (!ADDRESS_PATTERN.test(trimmed)) {
        return { error: 'not a valid email address' };
    }

    return { address: trimmed.toLowerCase(), kind: 'address' };
}
