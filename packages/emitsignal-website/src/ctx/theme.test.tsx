import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { ThemeProvider, useTheme } from '#/ctx/theme';

function Probe() {
    const { resolvedTheme } = useTheme();

    return <div data-theme={resolvedTheme} />;
}

function renderOnServer(initialTheme: 'dark' | 'light' | 'system') {
    return renderToString(
        <ThemeProvider initialTheme={initialTheme}>
            <Probe />
        </ThemeProvider>,
    );
}

describe('ThemeProvider server rendering', () => {
    test('renders an explicitly chosen light theme', () => {
        expect(renderOnServer('light')).toContain('data-theme="light"');
    });

    test('renders an explicitly chosen dark theme', () => {
        expect(renderOnServer('dark')).toContain('data-theme="dark"');
    });

    test('falls back to dark for system, which needs the OS', () => {
        expect(renderOnServer('system')).toContain('data-theme="dark"');
    });
});
