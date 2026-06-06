import { getCookie } from '@tanstack/react-start/server';

export function hasAuthCookie(): boolean {
    return !!getCookie('better-auth.session_token');
}
