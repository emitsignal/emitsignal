import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'bun:test';

import { environmentSchema } from '../environment';

// The schema runs at import time, so anything it rejects is a boot failure with
// no route to a health check. These cases all reached production configs before.
describe('environmentSchema', () => {
    it('defaults TRUSTED_PROXY_HEADER to none when the variable is absent', () => {
        const parsed = Value.Parse(environmentSchema, {});

        expect(parsed.TRUSTED_PROXY_HEADER).toBe('none');
    });

    it('rejects an empty TRUSTED_PROXY_HEADER', () => {
        // TypeBox applies `default` only for absent keys, so a compose file
        // written as `${TRUSTED_PROXY_HEADER:-}` passes '' and throws. Callers
        // must supply a real literal — see docker-compose.yml.
        expect(() => Value.Parse(environmentSchema, { TRUSTED_PROXY_HEADER: '' })).toThrow();
    });

    it('accepts every documented proxy header', () => {
        for (const header of ['none', 'cf-connecting-ip', 'x-real-ip', 'x-forwarded-for']) {
            expect(Value.Parse(environmentSchema, { TRUSTED_PROXY_HEADER: header })).toMatchObject({
                TRUSTED_PROXY_HEADER: header,
            });
        }
    });

    it('accepts a NODE_ENV outside the three well-known values', () => {
        const parsed = Value.Parse(environmentSchema, { NODE_ENV: 'staging' });

        expect(parsed.NODE_ENV).toBe('staging');
    });

    it('defaults NODE_ENV to development', () => {
        expect(Value.Parse(environmentSchema, {}).NODE_ENV).toBe('development');
    });
});
