// Guards for opening/rendering publisher-supplied URLs on the clients.
//
// Message actions, attachments and links come from arbitrary publishers, so a
// URL may be a `javascript:`/`data:` scheme (XSS in a browser context) or an
// unexpected custom scheme (deep-link abuse on mobile). Only http(s) — and
// optionally mailto — are safe to hand to `window.open`, an `<a href>`, or
// React Native's `Linking.openURL`.

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function externalUrlLabel(value: null | string | undefined): null | string {
    if (!isSafeExternalUrl(value)) {
        return null;
    }

    const url = new URL(value as string);

    if (url.protocol === 'mailto:') {
        return url.pathname || null;
    }

    return url.host.replace(/^www\./, '') || null;
}

export function isSafeExternalUrl(value: null | string | undefined): boolean {
    if (typeof value !== 'string' || value.trim() === '') {
        return false;
    }

    let url: URL;

    try {
        url = new URL(value);
    } catch {
        return false;
    }

    return SAFE_PROTOCOLS.has(url.protocol);
}

// Returns the URL if safe, otherwise null — convenient for `href={safeExternalUrl(x) ?? undefined}`.
export function safeExternalUrl(value: null | string | undefined): null | string {
    return isSafeExternalUrl(value) ? (value as string) : null;
}
