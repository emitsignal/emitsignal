import { useEffect, useState } from 'react';

import { SITE_URL } from '#/lib/seo';

// Starts at SITE_URL so SSR and the first client render agree, then swaps to the
// real origin after mount. Reading window.location during render would mismatch.
export function useSiteOrigin(): string {
    const [origin, setOrigin] = useState(SITE_URL);

    useEffect(() => setOrigin(window.location.origin), []);

    return origin;
}
