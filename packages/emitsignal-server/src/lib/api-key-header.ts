const BEARER_PREFIX = 'Bearer ';

// Every issued API key starts with this prefix (set as the apiKey plugin's
// `defaultPrefix`), so it identifies our keys in the shared Authorization header.
export const API_KEY_PREFIX = 'es_live_';

// API tokens are sent as `Authorization: Bearer es_live_…` (see the CLI, API
// docs and publish preview). Session tokens use the same Authorization header,
// so we only claim values carrying the API-key prefix — anything else falls
// through to the `bearer()` plugin. `x-api-key` is kept as a secondary header.
export function getApiKeyFromHeaders(headers: Headers | null | undefined): null | string {
    const authorization = headers?.get('authorization');

    if (authorization?.startsWith(BEARER_PREFIX + API_KEY_PREFIX)) {
        return authorization.slice(BEARER_PREFIX.length);
    }

    return headers?.get('x-api-key') ?? null;
}
