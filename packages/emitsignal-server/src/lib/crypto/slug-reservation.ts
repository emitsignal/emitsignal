import { createHmac, timingSafeEqual } from 'node:crypto';

import { environment } from '#/schema/environment';

// A reserved slug passes through the browser, so it comes back signed. Without this the
// slug field would let any API client choose its own endpoint URL.

const RESERVATION_TTL_MS = 60 * 60 * 1000;

export function signSlugReservation(slug: string, issuedAt = Date.now()): string {
    return `${issuedAt}.${digest(slug, issuedAt)}`;
}

export function verifySlugReservation(slug: string, reservation: string): boolean {
    const [issuedAtPart, signature] = reservation.split('.');
    const issuedAt = Number(issuedAtPart);

    if (!signature || !Number.isFinite(issuedAt)) {
        return false;
    }

    const age = Date.now() - issuedAt;

    if (age < 0 || age > RESERVATION_TTL_MS) {
        return false;
    }

    const expected = Buffer.from(digest(slug, issuedAt));
    const received = Buffer.from(signature);

    return expected.length === received.length && timingSafeEqual(expected, received);
}

function digest(slug: string, issuedAt: number): string {
    // Namespaced so this signature can never be replayed as another kind of token.
    return createHmac('sha256', environment.BETTER_AUTH_SECRET)
        .update(`webhook-slug-reservation:${slug}:${issuedAt}`)
        .digest('base64url');
}
