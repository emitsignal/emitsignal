import * as Sentry from '@sentry/bun';
import Elysia from 'elysia';

import { logger } from '#/lib/logger';
import { isUnobservedPath } from '#/utils/observability';

function contentLength(set: { headers: Record<string, string | undefined> }, body: unknown) {
    const header = set.headers['content-length'];

    if (header) {
        return header;
    }

    if (body == null) {
        return '-';
    }

    if (typeof body === 'string') {
        return Buffer.byteLength(body).toString();
    }

    try {
        return Buffer.byteLength(JSON.stringify(body)).toString();
    } catch {
        return '-';
    }
}

export const loggerPlugin = new Elysia({ name: 'logger' })
    .decorate('logger', logger)
    .state('requestStart', 0)
    .onRequest(({ store }) => {
        store.requestStart = performance.now();
    })
    .onAfterResponse(({ request, responseValue, set, store }) => {
        const status = set.status ?? 200;

        const path = new URL(request.url).pathname;

        if (isUnobservedPath(path) && (status as number) < 400) {
            return;
        }

        const durationMs = (performance.now() - store.requestStart).toFixed(3);
        const length = contentLength(set as never, responseValue);
        const message = `${request.method} ${path} ${status} ${durationMs} ms - ${length}`;

        if ((status as number) >= 400) {
            logger.error(message);

            return;
        }

        logger.info(message);
    })
    .onError(({ code, error, request }) => {
        const path = new URL(request.url).pathname;

        if (code === 'NOT_FOUND') {
            return;
        }

        if (code === 'VALIDATION') {
            logger.error(
                { cause: error.cause, code, method: request.method, url: path },
                'validation errors',
            );

            return;
        }

        logger.error({ code, error, method: request.method, url: path }, 'request failed');

        Sentry.captureException(error, {
            extra: { method: request.method, url: path },
            tags: { code },
        });
    })
    .as('global');
