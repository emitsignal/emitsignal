import { CLI_ORIGIN } from '@emitsignal/shared';
import { describe, expect, it } from 'bun:test';

import { auth } from '#/lib/auth';

describe('auth trustedOrigins', () => {
    it('trusts the CLI origin, which is how non-browser clients pass the origin check', () => {
        expect(auth.options.trustedOrigins).toContain(CLI_ORIGIN);
    });
});
