import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { NotifPreview } from './notif-preview';

function renderPreview(link?: string, linkLabel?: string) {
    return render(
        <NotifPreview
            body="body"
            channel="deploys"
            link={link}
            linkLabel={linkLabel}
            priority={3}
            title="title"
        />,
    );
}

describe('NotifPreview link', () => {
    test('renders a view button for an http(s) link', () => {
        renderPreview('https://status.dev/run/42');

        expect(screen.getByText('View')).toBeDefined();
        expect(screen.queryByText('View · dropped')).toBeNull();
    });

    test('renders the dropped state for a relative link', () => {
        renderPreview('/repos/acme/api');

        expect(screen.getByText('View · dropped')).toBeDefined();
    });

    test('renders the dropped state for a javascript: link', () => {
        renderPreview('javascript:alert(1)');

        expect(screen.getByText('View · dropped')).toBeDefined();
    });

    // The server's isValidHref is http(s)-only, so a mailto: link is dropped on
    // delivery even though it is a "safe" URL for rendering purposes.
    test('renders the dropped state for a mailto: link', () => {
        renderPreview('mailto:ops@acme.dev');

        expect(screen.getByText('View · dropped')).toBeDefined();
    });

    test('renders no button at all when there is no link', () => {
        renderPreview('');

        expect(screen.queryByText('View')).toBeNull();
        expect(screen.queryByText('View · dropped')).toBeNull();
    });
});

describe('NotifPreview link label', () => {
    test('renders a custom label on the button', () => {
        renderPreview('https://status.dev/run/42', 'Open run');

        expect(screen.getByText('Open run')).toBeDefined();
        expect(screen.queryByText('View')).toBeNull();
    });

    test('falls back to View for an empty label', () => {
        renderPreview('https://status.dev/run/42', '   ');

        expect(screen.getByText('View')).toBeDefined();
    });

    test('renders the capped label the server will deliver', () => {
        renderPreview('https://status.dev/run/42', 'x'.repeat(60));

        expect(screen.getByText('x'.repeat(40))).toBeDefined();
    });

    test('labels the dropped state with the custom label too', () => {
        renderPreview('/repos/acme/api', 'Open repo');

        expect(screen.getByText('Open repo · dropped')).toBeDefined();
    });
});
