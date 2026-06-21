import { getCookie } from '@tanstack/react-start/server';

export function hasAuthCookie(): boolean {
    // In production (HTTPS) Better Auth prefixes the cookie with `__Secure-`;
    // in dev (HTTP) it is unprefixed. Check both so the SSR guard works in
    // every environment.
    return !!(
        getCookie('better-auth.session_token') || getCookie('__Secure-better-auth.session_token')
    );
}
