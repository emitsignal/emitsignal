import { useRouterState } from '@tanstack/react-router';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { setPreferenceCookie } from '#/lib/cookies';
import { SIDEBAR_STATE_KEY, type SidebarState } from '#/lib/sidebar';

interface SidebarContextValue {
    /** Desktop-only: the sidebar is reduced to an icon rail. Persisted. */
    collapsed: boolean;
    /** Below `md` the sidebar is an overlay drawer. Never persisted. */
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

/**
 * Dashboard-scoped sidebar provider. The collapse preference is stored in one
 * cookie so the server renders the rail at the right width, while the mobile
 * drawer is transient — it closes on navigation and on Escape.
 */
export function SidebarProvider({
    children,
    initialState,
}: {
    children: ReactNode;
    initialState: SidebarState;
}) {
    const [collapsed, setCollapsed] = useState(initialState === 'collapsed');
    const [mobileOpen, setMobileOpen] = useState(false);

    const href = useRouterState({ select: (state) => state.location.href });

    useEffect(() => {
        setMobileOpen(false);
    }, [href]);

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [mobileOpen]);

    const toggleCollapsed = () => {
        setCollapsed((previous) => {
            const next = !previous;

            if (typeof document !== 'undefined') {
                setPreferenceCookie(SIDEBAR_STATE_KEY, next ? 'collapsed' : 'expanded');
            }

            return next;
        });
    };

    return (
        <SidebarContext.Provider value={{ collapsed, mobileOpen, setMobileOpen, toggleCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar(): SidebarContextValue {
    const context = useContext(SidebarContext);

    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }

    return context;
}
