import Elysia from 'elysia';

import { logger } from './logger';

function contentLength(set: { headers: Record<string, string | undefined> }, body: unknown) {
    const header = set.headers['content-length'];

    if (header) return header;

    if (body == null) return '-';
    if (typeof body === 'string') return Buffer.byteLength(body).toString();

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
        const durationMs = (performance.now() - store.requestStart).toFixed(3);
        const status = set.status ?? 200;
        const path = new URL(request.url).pathname;
        const length = contentLength(set as never, responseValue);

        logger.info(`${request.method} ${path} ${status} ${durationMs} ms - ${length}`);
    })
    .onError(({ code, error, request, set }) => {
        const path = new URL(request.url).pathname;

        if (code === 'NOT_FOUND') {
            set.status = 404;

            return { error: 'Not Found', path, status: 404 };
        }

        logger.error({ code, err: error, method: request.method, url: path }, 'request failed');
    })
    .as('global');
