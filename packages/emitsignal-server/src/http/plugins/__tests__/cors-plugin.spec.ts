import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';

import { corsPlugin } from '#/http/plugins/cors-plugin';
import { environment } from '#/schema/environment';

const APP_ORIGIN = environment.APP_URL;
const FOREIGN_ORIGIN = 'https://foreign.example';

const app = new Elysia()
    .use(corsPlugin)
    .post('/publish/*', () => ({ message: 'posted' }))
    .post('/topic/*', () => ({ message: 'posted' }))
    .get('/topics', () => []);

function request(method: string, path: string, origin?: string) {
    return new Request(`http://localhost${path}`, {
        headers: origin ? { origin } : {},
        method,
    });
}

describe('corsPlugin', () => {
    describe('publish routes', () => {
        it('answers a foreign preflight with a wildcard origin and no credentials', async () => {
            const res = await app.handle(request('OPTIONS', '/publish/alerts', FOREIGN_ORIGIN));

            expect(res.status).toBe(204);
            expect(res.headers.get('access-control-allow-origin')).toBe('*');
            expect(res.headers.get('access-control-allow-credentials')).toBeNull();
        });

        it('allows the header-based publish fields in preflight', async () => {
            const res = await app.handle(request('OPTIONS', '/publish/alerts', FOREIGN_ORIGIN));

            const allowedHeaders = res.headers.get('access-control-allow-headers') ?? '';

            expect(allowedHeaders).toContain('X-Title');
            expect(allowedHeaders).toContain('X-Priority');
            expect(allowedHeaders).toContain('X-Tags');
            expect(allowedHeaders).toContain('X-Api-Key');
            expect(res.headers.get('access-control-allow-methods')).toContain('POST');
            expect(res.headers.get('access-control-max-age')).toBe('600');
        });

        it('sets the wildcard origin and exposed headers on the actual response', async () => {
            const res = await app.handle(request('POST', '/publish/alerts', FOREIGN_ORIGIN));

            expect(res.status).toBe(200);
            expect(res.headers.get('access-control-allow-origin')).toBe('*');
            expect(res.headers.get('access-control-expose-headers')).toContain('X-Quota-Limit');
            expect(res.headers.get('vary')).toBe('Origin');
        });

        it('applies the public policy to the deprecated /topic alias', async () => {
            const res = await app.handle(request('OPTIONS', '/topic/alerts', FOREIGN_ORIGIN));

            expect(res.headers.get('access-control-allow-origin')).toBe('*');
        });

        it('allows the header-based publish fields for the app origin too', async () => {
            const res = await app.handle(request('OPTIONS', '/publish/alerts', APP_ORIGIN));

            const allowedHeaders = res.headers.get('access-control-allow-headers') ?? '';

            expect(allowedHeaders).toContain('X-Title');
            expect(allowedHeaders).toContain('X-Priority');
        });

        it('keeps the credentialed policy for the app origin', async () => {
            const res = await app.handle(request('POST', '/publish/alerts', APP_ORIGIN));

            expect(res.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
            expect(res.headers.get('access-control-allow-credentials')).toBe('true');
        });
    });

    describe('other routes', () => {
        it('refuses a foreign origin', async () => {
            const res = await app.handle(request('OPTIONS', '/topics', FOREIGN_ORIGIN));

            expect(res.status).toBe(204);
            expect(res.headers.get('access-control-allow-origin')).toBeNull();
        });

        it('allows the app origin with credentials', async () => {
            const res = await app.handle(request('GET', '/topics', APP_ORIGIN));

            expect(res.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
            expect(res.headers.get('access-control-allow-credentials')).toBe('true');
        });

        it('restricts preflight headers to the app allowlist', async () => {
            const res = await app.handle(request('OPTIONS', '/topics', APP_ORIGIN));

            expect(res.headers.get('access-control-allow-headers')).toBe(
                'Content-Type, Authorization',
            );
        });
    });
});
