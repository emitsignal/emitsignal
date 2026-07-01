import { describe, expect, it } from 'bun:test';
import { Elysia, t } from 'elysia';

import { errorResponsePlugin } from '../error-response-plugin';
import { loggerPlugin } from '../logger-plugin';

describe('errorResponsePlugin onError', () => {
    const app = new Elysia()
        .use(loggerPlugin)
        .use(errorResponsePlugin)
        .get('/boom', () => {
            throw new Error(
                'Invalid `prisma.subscription.findMany()` invocation in /Users/kevenleone/Documents/projects/personal/emitsignal/packages/emitsignal-server/src/http/subscriptions/resolve.ts:33:48',
            );
        })
        .post('/validated', () => 'ok', { body: t.Object({ title: t.String() }) });

    it('returns a generic 500 body and never leaks the underlying error message', async () => {
        const res = await app.handle(new Request('http://localhost/boom'));
        const text = await res.text();

        expect(res.status).toBe(500);
        expect(JSON.parse(text)).toEqual({ error: 'Internal Server Error', status: 500 });
        expect(text).not.toContain('prisma');
        expect(text).not.toContain('resolve.ts');
        expect(text).not.toContain('/Users/');
    });

    it('returns a generic 422 body for validation failures', async () => {
        const res = await app.handle(
            new Request('http://localhost/validated', {
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            }),
        );
        const data = await res.json();

        expect(res.status).toBe(422);
        expect(data).toEqual({ error: 'Validation Error', status: 422 });
    });

    it('still returns a 404 with the request path for unmatched routes', async () => {
        const res = await app.handle(new Request('http://localhost/does-not-exist'));
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data).toEqual({ error: 'Not Found', path: '/does-not-exist', status: 404 });
    });
});
