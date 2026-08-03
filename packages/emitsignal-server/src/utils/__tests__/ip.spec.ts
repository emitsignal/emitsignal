import { afterEach, describe, expect, it } from 'bun:test';

import { environment } from '#/schema/environment';
import { getClientIP } from '#/utils/ip';

describe('getClientIP', () => {
    it('ignores X-Forwarded-For when no proxy header is trusted', () => {
        const req = new Request('http://localhost/', {
            headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        });
        const server = { requestIP: () => ({ address: '203.0.113.7' }) };

        expect(getClientIP(req, server)).toBe('203.0.113.7');
    });

    it('ignores spoofed X-Real-IP and CF-Connecting-IP by default', () => {
        const req = new Request('http://localhost/', {
            headers: { 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '9.9.9.9' },
        });
        const server = { requestIP: () => ({ address: '203.0.113.7' }) };

        expect(getClientIP(req, server)).toBe('203.0.113.7');
    });

    it('falls back to server.requestIP when header is absent', () => {
        const req = new Request('http://localhost/');
        const server = { requestIP: () => ({ address: '10.0.0.1' }) };

        expect(getClientIP(req, server)).toBe('10.0.0.1');
    });

    it('returns "unknown" when server is null', () => {
        const req = new Request('http://localhost/');

        expect(getClientIP(req, null)).toBe('unknown');
    });

    it('returns "unknown" when server.requestIP returns null', () => {
        const req = new Request('http://localhost/');
        const server = { requestIP: () => null };

        expect(getClientIP(req, server)).toBe('unknown');
    });

    describe('with a trusted proxy header configured', () => {
        const original = environment.TRUSTED_PROXY_HEADER;

        afterEach(() => {
            environment.TRUSTED_PROXY_HEADER = original;
        });

        it('reads the configured header only', () => {
            environment.TRUSTED_PROXY_HEADER = 'x-real-ip';

            const req = new Request('http://localhost/', {
                headers: { 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '9.9.9.9' },
            });

            expect(getClientIP(req, null)).toBe('9.9.9.9');
        });

        it('takes the RIGHTMOST public hop of x-forwarded-for', () => {
            environment.TRUSTED_PROXY_HEADER = 'x-forwarded-for';

            // A client that prepends its own value must not win: the address our
            // proxy observed is appended on the right.
            const req = new Request('http://localhost/', {
                headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.9' },
            });

            expect(getClientIP(req, null)).toBe('203.0.113.9');
        });

        it('skips private hops when walking right-to-left', () => {
            environment.TRUSTED_PROXY_HEADER = 'x-forwarded-for';

            const req = new Request('http://localhost/', {
                headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.9, 10.0.0.5' },
            });

            expect(getClientIP(req, null)).toBe('203.0.113.9');
        });

        it('falls back to the peer address when the trusted header is absent', () => {
            environment.TRUSTED_PROXY_HEADER = 'x-real-ip';

            const req = new Request('http://localhost/');
            const server = { requestIP: () => ({ address: '203.0.113.7' }) };

            expect(getClientIP(req, server)).toBe('203.0.113.7');
        });
    });
});
