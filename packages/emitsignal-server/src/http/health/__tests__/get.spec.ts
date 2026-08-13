import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';

import { health } from '../get';

describe('GET /health', () => {
    it('reports the service as up', async () => {
        const app = new Elysia().use(health);

        const res = await app.handle(new Request('http://localhost/health'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data.status).toBe('ok');
        expect(typeof data.uptime).toBe('number');
    });
});
