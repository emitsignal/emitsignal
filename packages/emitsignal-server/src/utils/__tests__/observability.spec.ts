import { describe, expect, it } from 'bun:test';

import { isUnobservedPath } from '../observability';

describe('isUnobservedPath', () => {
    it('excludes the health check path', () => {
        expect(isUnobservedPath('/health')).toBe(true);
    });

    it('keeps every other path observed', () => {
        expect(isUnobservedPath('/')).toBe(false);
        expect(isUnobservedPath('/health/deep')).toBe(false);
        expect(isUnobservedPath('/topics/alerts/listen')).toBe(false);
    });
});
