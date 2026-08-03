import { describe, expect, it } from 'bun:test';

import { parseTagsQueryParam } from '#/utils/tags';

describe('parseTagsQueryParam', () => {
    it('splits a comma-separated string into trimmed tags', () => {
        expect(parseTagsQueryParam('urgent, news ,sev2')).toEqual(['urgent', 'news', 'sev2']);
    });

    it('deduplicates tags', () => {
        expect(parseTagsQueryParam('a,a,b')).toEqual(['a', 'b']);
    });

    it('drops empty segments', () => {
        expect(parseTagsQueryParam('a,,b,')).toEqual(['a', 'b']);
    });

    it('returns empty array for undefined', () => {
        expect(parseTagsQueryParam(undefined)).toEqual([]);
    });

    it('returns empty array for empty string', () => {
        expect(parseTagsQueryParam('')).toEqual([]);
    });
});
