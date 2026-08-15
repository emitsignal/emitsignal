import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import Elysia, { t } from 'elysia';

import { logger } from '#/lib/logger';

import { loggerPlugin } from '../logger-plugin';

mock.module('@sentry/bun', () => ({ captureException: () => {} }));

const info = spyOn(logger, 'info');
const warn = spyOn(logger, 'warn');
const error = spyOn(logger, 'error');

function buildApp() {
    return new Elysia()
        .use(loggerPlugin)
        .get('/health', () => 'ok')
        .get('/ok', () => ({ ok: true }))
        .get('/boom', () => {
            throw new Error('kaboom');
        })
        .post('/echo', ({ body }) => body, { body: t.Object({ title: t.String() }) });
}

// onAfterResponse fires after the handler resolves, so the assertions need a tick.
async function call(path: string, init?: RequestInit) {
    const response = await buildApp().handle(new Request(`http://localhost${path}`, init));

    await Bun.sleep(1);

    return response;
}

afterEach(() => {
    info.mockClear();
    warn.mockClear();
    error.mockClear();
});

describe('loggerPlugin access log', () => {
    it('logs a successful request at info with structured fields', async () => {
        await call('/ok');

        expect(info).toHaveBeenCalledTimes(1);

        const [fields, message] = info.mock.calls[0] as [Record<string, unknown>, string];

        expect(message).toBe('request');
        expect(fields.method).toBe('GET');
        expect(fields.path).toBe('/ok');
        expect(fields.status).toBe(200);
        expect(typeof fields.durationMs).toBe('number');
    });

    it('measures each request separately rather than sharing one timestamp', async () => {
        const app = buildApp();

        await Promise.all([
            app.handle(new Request('http://localhost/ok')),
            app.handle(new Request('http://localhost/ok')),
        ]);

        await Bun.sleep(1);

        const durations = info.mock.calls.map(
            (arguments_) => (arguments_[0] as { durationMs: number }).durationMs,
        );

        expect(durations).toHaveLength(2);
        expect(durations.every((duration) => duration >= 0)).toBe(true);
    });

    it('skips the health check when it succeeds', async () => {
        await call('/health');

        expect(info).not.toHaveBeenCalled();
    });

    it('logs client errors at warn, not error', async () => {
        await call('/missing');

        expect(error).not.toHaveBeenCalled();
        expect((warn.mock.calls[0]?.[0] as { status: number }).status).toBe(404);
    });

    it('omits the duration when no route matched instead of reporting NaN', async () => {
        await call('/missing');

        expect((warn.mock.calls[0]?.[0] as { durationMs?: number }).durationMs).toBeUndefined();
    });

    it('logs server errors at error', async () => {
        await call('/boom');

        const accessCall = error.mock.calls.find((arguments_) => arguments_[1] === 'request');

        expect((accessCall?.[0] as { status: number }).status).toBe(500);
    });

    it('reports validation failures at warn with field paths but no submitted values', async () => {
        await call('/echo', {
            body: JSON.stringify({ title: 42 }),
            headers: { 'content-type': 'application/json' },
            method: 'POST',
        });

        const validationCall = warn.mock.calls.find(
            (arguments_) => arguments_[1] === 'validation failed',
        );

        expect(validationCall).toBeDefined();

        const fields = validationCall?.[0] as { fields: string[] };

        expect(fields.fields).toContain('/title');
        expect(JSON.stringify(fields)).not.toContain('42');
    });
});
