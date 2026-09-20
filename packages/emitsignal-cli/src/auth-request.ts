import { CLI_ORIGIN } from '@emitsignal/shared';

import { getBaseUrl, getToken } from './config.ts';

interface AuthRequestOptions extends RequestInit {
    /** Defaults to the stored token; `null` sends the request unauthenticated. */
    token?: null | string;
}

export async function authRequest<TResponse>(
    path: string,
    { token, ...init }: AuthRequestOptions = {},
): Promise<TResponse> {
    const bearer = token === undefined ? getToken() : token;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Origin: CLI_ORIGIN,
    };

    if (bearer) {
        headers['Authorization'] = `Bearer ${bearer}`;
    }

    const response = await fetch(`${getBaseUrl()}/api/auth${path}`, { ...init, headers });

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);

        throw new Error(`${response.status} ${text}`);
    }

    if (response.status === 204) {
        return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
}
