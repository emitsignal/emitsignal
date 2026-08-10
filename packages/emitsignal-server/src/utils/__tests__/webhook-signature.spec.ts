import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';

import {
    isVerificationScheme,
    parseVerificationConfig,
    schemeNeedsConfig,
    verifyWebhookSignature,
} from '#/utils/webhook-signature';

const SECRET = 'a-webhook-secret';
const RAW_BODY = '{"action":"opened","number":42}';

function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

describe('verifyWebhookSignature', () => {
    it('passes through when the scheme is none', () => {
        const result = verifyWebhookSignature({
            config: null,
            headers: {},
            rawBody: RAW_BODY,
            scheme: 'none',
            secret: '',
        });

        expect(result).toEqual({ ok: true });
    });

    it('rejects any verified scheme when no secret is present', () => {
        const result = verifyWebhookSignature({
            config: null,
            headers: {},
            rawBody: RAW_BODY,
            scheme: 'github',
            secret: '',
        });

        expect(result).toEqual({ ok: false, reason: 'bad_config' });
    });

    describe('github', () => {
        function githubHeader(body: string, secret: string): string {
            return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
        }

        function verify(headers: Record<string, string | undefined>, rawBody = RAW_BODY) {
            return verifyWebhookSignature({
                config: null,
                headers,
                rawBody,
                scheme: 'github',
                secret: SECRET,
            });
        }

        it('accepts a valid sha256 signature', () => {
            expect(verify({ 'x-hub-signature-256': githubHeader(RAW_BODY, SECRET) })).toEqual({
                ok: true,
            });
        });

        it('rejects a signature made with a different secret', () => {
            expect(
                verify({ 'x-hub-signature-256': githubHeader(RAW_BODY, 'wrong-secret') }),
            ).toEqual({ ok: false, reason: 'bad_signature' });
        });

        it('rejects when the body was tampered with after signing', () => {
            expect(
                verify(
                    { 'x-hub-signature-256': githubHeader(RAW_BODY, SECRET) },
                    '{"action":"closed","number":42}',
                ),
            ).toEqual({ ok: false, reason: 'bad_signature' });
        });

        it('rejects a missing header', () => {
            expect(verify({})).toEqual({ ok: false, reason: 'missing_signature' });
        });

        it('rejects a header without the sha256= prefix', () => {
            expect(verify({ 'x-hub-signature-256': 'abc123' })).toEqual({
                ok: false,
                reason: 'bad_signature',
            });
        });
    });

    describe('stripe', () => {
        function stripeHeader(timestamp: number, secret: string, extra?: string): string {
            const signature = createHmac('sha256', secret)
                .update(`${timestamp}.${RAW_BODY}`, 'utf8')
                .digest('hex');

            return `t=${timestamp},v1=${extra ?? signature}${extra ? `,v1=${signature}` : ''}`;
        }

        function verify(headers: Record<string, string | undefined>) {
            return verifyWebhookSignature({
                config: null,
                headers,
                rawBody: RAW_BODY,
                scheme: 'stripe',
                secret: SECRET,
            });
        }

        it('accepts a valid signature', () => {
            expect(verify({ 'stripe-signature': stripeHeader(nowSeconds(), SECRET) })).toEqual({
                ok: true,
            });
        });

        it('accepts when one of several v1 entries matches (secret rotation)', () => {
            const header = stripeHeader(nowSeconds(), SECRET, 'deadbeef');

            expect(header.split('v1=').length).toBe(3);
            expect(verify({ 'stripe-signature': header })).toEqual({ ok: true });
        });

        it('rejects a signature outside the tolerance window', () => {
            expect(
                verify({ 'stripe-signature': stripeHeader(nowSeconds() - 600, SECRET) }),
            ).toEqual({ ok: false, reason: 'stale_timestamp' });
        });

        it('rejects a valid signature over a different timestamp', () => {
            const timestamp = nowSeconds();
            const signature = createHmac('sha256', SECRET)
                .update(`${timestamp - 5}.${RAW_BODY}`, 'utf8')
                .digest('hex');

            expect(verify({ 'stripe-signature': `t=${timestamp},v1=${signature}` })).toEqual({
                ok: false,
                reason: 'bad_signature',
            });
        });

        it('rejects a header with no v1 entry', () => {
            expect(verify({ 'stripe-signature': `t=${nowSeconds()}` })).toEqual({
                ok: false,
                reason: 'missing_signature',
            });
        });
    });

    describe('svix', () => {
        const KEY_BYTES = Buffer.from('svix-key-material-32-bytes-long!', 'utf8');
        const SVIX_SECRET = `whsec_${KEY_BYTES.toString('base64')}`;
        const IDENTIFIER = 'msg_2abc';

        function svixHeaders(timestamp: number, key: Buffer) {
            const signature = createHmac('sha256', key)
                .update(`${IDENTIFIER}.${timestamp}.${RAW_BODY}`, 'utf8')
                .digest('base64');

            return {
                'svix-id': IDENTIFIER,
                'svix-signature': `v1,${signature}`,
                'svix-timestamp': String(timestamp),
            };
        }

        function verify(headers: Record<string, string | undefined>) {
            return verifyWebhookSignature({
                config: null,
                headers,
                rawBody: RAW_BODY,
                scheme: 'svix',
                secret: SVIX_SECRET,
            });
        }

        it('accepts a valid signature over id.timestamp.body', () => {
            expect(verify(svixHeaders(nowSeconds(), KEY_BYTES))).toEqual({ ok: true });
        });

        it('accepts when the signature list carries an unknown version alongside v1', () => {
            const headers = svixHeaders(nowSeconds(), KEY_BYTES);

            expect(
                verify({ ...headers, 'svix-signature': `v0,ignored ${headers['svix-signature']}` }),
            ).toEqual({ ok: true });
        });

        it('rejects a signature made with different key material', () => {
            const wrongKey = Buffer.from('a-completely-different-key-here!', 'utf8');

            expect(verify(svixHeaders(nowSeconds(), wrongKey))).toEqual({
                ok: false,
                reason: 'bad_signature',
            });
        });

        it('rejects a stale timestamp', () => {
            expect(verify(svixHeaders(nowSeconds() - 600, KEY_BYTES))).toEqual({
                ok: false,
                reason: 'stale_timestamp',
            });
        });

        it('rejects when any svix header is missing', () => {
            const headers = svixHeaders(nowSeconds(), KEY_BYTES);

            expect(verify({ ...headers, 'svix-id': undefined })).toEqual({
                ok: false,
                reason: 'missing_signature',
            });
        });
    });

    describe('hmac', () => {
        const config = JSON.stringify({
            algorithm: 'sha1',
            encoding: 'hex',
            header: 'x-vercel-signature',
        });

        function verify(headers: Record<string, string | undefined>, rawConfig = config) {
            return verifyWebhookSignature({
                config: rawConfig,
                headers,
                rawBody: RAW_BODY,
                scheme: 'hmac',
                secret: SECRET,
            });
        }

        it('accepts a configured sha1 hex signature', () => {
            const signature = createHmac('sha1', SECRET).update(RAW_BODY, 'utf8').digest('hex');

            expect(verify({ 'x-vercel-signature': signature })).toEqual({ ok: true });
        });

        it('accepts a base64 signature behind a configured prefix', () => {
            const signature = createHmac('sha256', SECRET)
                .update(RAW_BODY, 'utf8')
                .digest('base64');

            expect(
                verify(
                    { 'x-shopify-hmac': `sha256=${signature}` },
                    JSON.stringify({
                        algorithm: 'sha256',
                        encoding: 'base64',
                        header: 'x-shopify-hmac',
                        prefix: 'sha256=',
                    }),
                ),
            ).toEqual({ ok: true });
        });

        it('rejects when the configured prefix is absent', () => {
            const signature = createHmac('sha256', SECRET)
                .update(RAW_BODY, 'utf8')
                .digest('base64');

            expect(
                verify(
                    { 'x-shopify-hmac': signature },
                    JSON.stringify({
                        algorithm: 'sha256',
                        encoding: 'base64',
                        header: 'x-shopify-hmac',
                        prefix: 'sha256=',
                    }),
                ),
            ).toEqual({ ok: false, reason: 'bad_signature' });
        });

        it('rejects a malformed config', () => {
            expect(verify({ 'x-vercel-signature': 'whatever' }, '{not json')).toEqual({
                ok: false,
                reason: 'bad_config',
            });
        });

        it('rejects a config with an unsupported algorithm', () => {
            expect(
                verify(
                    { 'x-vercel-signature': 'whatever' },
                    JSON.stringify({ algorithm: 'md5', header: 'x-vercel-signature' }),
                ),
            ).toEqual({ ok: false, reason: 'bad_config' });
        });
    });

    describe('token', () => {
        const config = JSON.stringify({ header: 'authorization', prefix: 'Bearer ' });

        function verify(headers: Record<string, string | undefined>) {
            return verifyWebhookSignature({
                config,
                headers,
                rawBody: RAW_BODY,
                scheme: 'token',
                secret: SECRET,
            });
        }

        it('accepts a matching shared token', () => {
            expect(verify({ authorization: `Bearer ${SECRET}` })).toEqual({ ok: true });
        });

        it('rejects a different token of the same length', () => {
            expect(verify({ authorization: `Bearer ${'x'.repeat(SECRET.length)}` })).toEqual({
                ok: false,
                reason: 'bad_signature',
            });
        });

        it('rejects a missing header', () => {
            expect(verify({})).toEqual({ ok: false, reason: 'missing_signature' });
        });
    });
});

describe('parseVerificationConfig', () => {
    it('defaults algorithm and encoding and lowercases the header', () => {
        expect(parseVerificationConfig(JSON.stringify({ header: 'X-Signature' }))).toEqual({
            algorithm: 'sha256',
            encoding: 'hex',
            header: 'x-signature',
            prefix: '',
        });
    });

    it('returns null for null, malformed JSON, and a missing header', () => {
        expect(parseVerificationConfig(null)).toBeNull();
        expect(parseVerificationConfig('{oops')).toBeNull();
        expect(parseVerificationConfig(JSON.stringify({ header: '  ' }))).toBeNull();
    });
});

describe('scheme helpers', () => {
    it('recognizes known schemes only', () => {
        expect(isVerificationScheme('github')).toBe(true);
        expect(isVerificationScheme('paypal')).toBe(false);
    });

    it('requires config only for the user-configured schemes', () => {
        expect(schemeNeedsConfig('hmac')).toBe(true);
        expect(schemeNeedsConfig('token')).toBe(true);
        expect(schemeNeedsConfig('github')).toBe(false);
    });
});
