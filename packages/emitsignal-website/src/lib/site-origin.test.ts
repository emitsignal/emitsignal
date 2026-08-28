import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { SITE_URL } from '#/lib/seo';
import { useSiteOrigin } from '#/lib/site-origin';

describe('useSiteOrigin', () => {
    test('resolves to the browser origin rather than the configured site URL', async () => {
        const { result } = await act(async () => renderHook(() => useSiteOrigin()));

        expect(result.current).toBe(window.location.origin);
        expect(result.current).not.toBe(SITE_URL);
    });
});
