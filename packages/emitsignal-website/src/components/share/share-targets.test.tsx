import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { ShareTargets } from './share-targets';

describe('ShareTargets', () => {
    beforeEach(cleanup);

    const url = 'https://emitsignal.com/s/kx8f2a99';
    const title = 'Acme API v4.2 & more';

    test('encodes the URL and title into every target', () => {
        render(<ShareTargets title={title} url={url} />);

        const whatsapp = screen.getByTitle('Share on WhatsApp').getAttribute('href') ?? '';
        const email = screen.getByTitle('Share on Email').getAttribute('href') ?? '';

        // The raw ampersand must not leak through, or it truncates the payload.
        expect(whatsapp).toContain(encodeURIComponent(`${title} ${url}`));
        expect(whatsapp).not.toContain('v4.2 & more');
        expect(email).toContain(encodeURIComponent(title));
    });

    test('opens every target in a new tab without leaking the referrer opener', () => {
        render(<ShareTargets title={title} url={url} />);

        for (const label of ['WhatsApp', 'X', 'LinkedIn', 'Email']) {
            const anchor = screen.getByTitle(`Share on ${label}`);

            expect(anchor.getAttribute('target')).toBe('_blank');
            expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
        }
    });
});
