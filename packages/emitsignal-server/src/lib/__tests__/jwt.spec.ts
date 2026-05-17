import { describe, expect, it } from 'bun:test';

import { signToken, verifyToken } from '../jwt';

describe('jwt', () => {
    describe('signToken', () => {
        it('returns a non-empty string', async () => {
            const token = await signToken('user-1');
            expect(token).toBeString();
            expect(token.length).toBeGreaterThan(0);
        });

        it('returns a valid JWT with three segments', async () => {
            const token = await signToken('user-1');
            const parts = token.split('.');
            expect(parts).toHaveLength(3);
            parts.forEach((part) => expect(part).toBeString());
        });

        it('produces different tokens for different userIds', async () => {
            const a = await signToken('user-a');
            const b = await signToken('user-b');
            expect(a).not.toBe(b);
        });

        it('handles userIds with special characters', async () => {
            const token = await signToken('user-with-dashes_underscores');
            expect(token).toBeString();
        });
    });

    describe('verifyToken', () => {
        it('returns userId from a valid token', async () => {
            const token = await signToken('user-1');
            const userId = await verifyToken(token);
            expect(userId).toBe('user-1');
        });

        it('returns null for an empty string', async () => {
            const userId = await verifyToken('');
            expect(userId).toBeNull();
        });

        it('returns null for a malformed JWT', async () => {
            const userId = await verifyToken('not-a-jwt');
            expect(userId).toBeNull();
        });

        it('returns null for random string', async () => {
            const userId = await verifyToken('random-garbage-string');
            expect(userId).toBeNull();
        });

        it('returns null for whitespace string', async () => {
            const userId = await verifyToken('   ');
            expect(userId).toBeNull();
        });

        it('roundtrips various userIds', async () => {
            for (const id of ['user-1', 'abc', '123', 'a'.repeat(50)]) {
                const token = await signToken(id);
                const result = await verifyToken(token);
                expect(result).toBe(id);
            }
        });
    });
});
