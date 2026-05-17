import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';

describe('GET /', () => {
    it('returns server name and version', async () => {
        const app = new Elysia().get('/', () => ({
            name: 'emitsignal',
            version: '1.0.0',
        }));

        const res = await app.handle(new Request('http://localhost/'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({ name: 'emitsignal', version: '1.0.0' });
    });
});
