import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SidebarState } from '#/lib/sidebar';

import { SidebarProvider, useSidebar } from '#/ctx/sidebar';

let href = '/app/inbox';

vi.mock('@tanstack/react-router', () => ({
    useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
        select({ location: { href } }),
}));

function Probe() {
    const { collapsed, mobileOpen, setMobileOpen, toggleCollapsed } = useSidebar();

    return (
        <>
            <span data-testid="collapsed">{String(collapsed)}</span>
            <span data-testid="mobile-open">{String(mobileOpen)}</span>
            <button onClick={toggleCollapsed}>toggle</button>
            <button onClick={() => setMobileOpen(true)}>open</button>
        </>
    );
}

function renderProvider(initialState: SidebarState = 'expanded') {
    return render(
        <SidebarProvider initialState={initialState}>
            <Probe />
        </SidebarProvider>,
    );
}

describe('SidebarProvider', () => {
    beforeEach(() => {
        cleanup();

        href = '/app/inbox';
        document.cookie = '@emitsignal/sidebar=; path=/; max-age=0';
    });

    test('seeds the collapsed state from the loader', () => {
        renderProvider('collapsed');

        expect(screen.getByTestId('collapsed').textContent).toBe('true');
    });

    test('toggling persists the choice to the preference cookie', () => {
        renderProvider();

        fireEvent.click(screen.getByText('toggle'));

        expect(screen.getByTestId('collapsed').textContent).toBe('true');
        expect(document.cookie).toContain('@emitsignal/sidebar=collapsed');

        fireEvent.click(screen.getByText('toggle'));

        expect(document.cookie).toContain('@emitsignal/sidebar=expanded');
    });

    test('closes the mobile drawer on navigation', () => {
        const { rerender } = renderProvider();

        fireEvent.click(screen.getByText('open'));
        expect(screen.getByTestId('mobile-open').textContent).toBe('true');

        href = '/app/channels';
        rerender(
            <SidebarProvider initialState="expanded">
                <Probe />
            </SidebarProvider>,
        );

        expect(screen.getByTestId('mobile-open').textContent).toBe('false');
    });

    test('closes the mobile drawer on Escape', () => {
        renderProvider();

        fireEvent.click(screen.getByText('open'));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(screen.getByTestId('mobile-open').textContent).toBe('false');
    });
});
