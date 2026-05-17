import { describe, expect, it } from 'bun:test';

import { signToken } from '../../../lib/jwt';
import { resolveUserId } from '../plugin';

describe('resolveUserId', () => {
    it('returns userId for a valid Bearer token', async () => {
        const token = await signToken('user-1');
        const headers = { authorization: `Bearer ${token}` };
        const result = await resolveUserId({ headers });

        expect(result).toBe('user-1');
    });

    it('returns null when Authorization header is missing', async () => {
        const result = await resolveUserId({ headers: {} });

        expect(result).toBeNull();
    });

    it('returns null when Authorization header is empty', async () => {
        const result = await resolveUserId({ headers: { authorization: '' } });

        expect(result).toBeNull();
    });

    it('passes token from non-Bearer schemes too (no prefix check)', async () => {
        const token = await signToken('user-1');
        const headers = { authorization: `Basic ${token}` };
        const result = await resolveUserId({ headers });

        expect(result).toBe('user-1');
    });

    it('returns null for Bearer without token', async () => {
        const headers = { authorization: 'Bearer ' };
        const result = await resolveUserId({ headers });

        expect(result).toBeNull();
    });

    it('returns null for an invalid token', async () => {
        const headers = { authorization: 'Bearer invalid-jwt' };
        const result = await resolveUserId({ headers });

        expect(result).toBeNull();
    });

    it('returns null when multiple spaces break token extraction', async () => {
        const headers = { authorization: 'Bearer   spaced-token' };
        const result = await resolveUserId({ headers });

        expect(result).toBeNull();
    });
});
