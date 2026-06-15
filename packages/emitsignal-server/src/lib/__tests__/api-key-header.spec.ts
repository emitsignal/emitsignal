import { describe, expect, it } from 'bun:test';

import { getApiKeyFromHeaders } from '../api-key-header';

describe('getApiKeyFromHeaders', () => {
    it('extracts an API token from the Authorization: Bearer header', () => {
        const headers = new Headers({ authorization: 'Bearer es_abc123' });

        expect(getApiKeyFromHeaders(headers)).toBe('es_abc123');
    });

    it('falls back to the x-api-key header', () => {
        const headers = new Headers({ 'x-api-key': 'es_xyz789' });

        expect(getApiKeyFromHeaders(headers)).toBe('es_xyz789');
    });

    it('ignores Bearer session tokens that are not API keys', () => {
        const headers = new Headers({ authorization: 'Bearer session-token-value' });

        expect(getApiKeyFromHeaders(headers)).toBeNull();
    });

    it('returns null when no API key header is present', () => {
        expect(getApiKeyFromHeaders(new Headers())).toBeNull();
        expect(getApiKeyFromHeaders(null)).toBeNull();
        expect(getApiKeyFromHeaders(undefined)).toBeNull();
    });
});
