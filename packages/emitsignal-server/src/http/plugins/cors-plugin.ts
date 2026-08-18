import Elysia from 'elysia';

import { environment } from '#/schema/environment';
import {
    ALLOWED_METHODS,
    APP_ALLOWED_HEADERS,
    EXPOSED_HEADERS,
    isPublicPublishPath,
    normalizeOrigin,
    PUBLISH_ALLOWED_HEADERS,
} from '#/utils/cors';

const PREFLIGHT_MAX_AGE_SECONDS = 600;

/**
 * Publishing is already open to the public internet, so browsers get the same reach as curl:
 * any origin may POST to /publish/*. That policy must never carry
 * access-control-allow-credentials — a wildcard origin plus cookies would let any page publish
 * as the visitor. Requests from APP_URL keep the credentialed policy so the website's own
 * cookie session still works.
 */
export const corsPlugin = new Elysia({ name: 'cors' }).onRequest(({ request, set }) => {
    const origin = request.headers.get('origin');

    const isAppOrigin =
        origin !== null && normalizeOrigin(origin) === normalizeOrigin(environment.APP_URL);
    const isPublishPath = isPublicPublishPath(new URL(request.url).pathname);

    set.headers.vary = 'Origin';
    set.headers['access-control-expose-headers'] = EXPOSED_HEADERS;

    // The app origin keeps the credentialed policy even on publish paths: a wildcard origin
    // would make the browser drop the cookie session the website publishes with.
    if (isAppOrigin) {
        set.headers['access-control-allow-origin'] = origin;
        set.headers['access-control-allow-credentials'] = 'true';
    } else if (isPublishPath) {
        set.headers['access-control-allow-origin'] = '*';
    }

    if (request.method === 'OPTIONS') {
        set.headers['access-control-allow-headers'] = isPublishPath
            ? PUBLISH_ALLOWED_HEADERS
            : APP_ALLOWED_HEADERS;
        set.headers['access-control-allow-methods'] = ALLOWED_METHODS;
        set.headers['access-control-max-age'] = String(PREFLIGHT_MAX_AGE_SECONDS);

        return new Response(null, { status: 204 });
    }
});
