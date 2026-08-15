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

// Client-caused failures (401, 404, 422, 429) are not our errors; logging them
// as such buries real 5xx incidents and inflates error-rate alerts.
function levelFor(status: number) {
    if (status >= 500) {
        return 'error' as const;
    }

    if (status >= 400) {
        return 'warn' as const;
    }

    return 'info' as const;
}

export const loggerPlugin = new Elysia({ name: 'logger' })
    .derive(() => ({ requestStart: performance.now() }))
    .onAfterResponse(({ request, requestStart, responseValue, set }) => {
        const status = (set.status ?? 200) as number;

        const path = new URL(request.url).pathname;

        if (isUnobservedPath(path) && status < 400) {
            return;
        }

        // No route matched means `derive` never ran, so there is no start time.
        const start = requestStart as number | undefined;

        logger[levelFor(status)](
            {
                durationMs:
                    start === undefined
                        ? undefined
                        : Number((performance.now() - start).toFixed(3)),
                length: contentLength(set as never, responseValue),
                method: request.method,
                path,
                status,
            },
            'request',
        );
    })
    .onError(({ code, error, request }) => {
        const path = new URL(request.url).pathname;

        if (code === 'NOT_FOUND') {
            return;
        }

        if (code === 'VALIDATION') {
            // Only the field paths: the TypeBox cause embeds the offending request
            // body value, which would put user input into the log pipeline.
            logger.warn(
                { code, fields: validationFields(error), method: request.method, url: path },
                'validation failed',
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

function validationFields(error: unknown): string[] {
    const all = (error as { all?: unknown }).all;

    if (!Array.isArray(all)) {
        return [];
    }

    return all
        .map((issue) => (issue as { path?: unknown }).path)
        .filter((path): path is string => typeof path === 'string');
}
