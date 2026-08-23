import { createContext, type ReactNode, useContext, useState, useSyncExternalStore } from 'react';

import { setPreferenceCookie } from '#/lib/cookies';
import {
    LIGHT_SCHEME_QUERY,
    type ResolvedTheme,
    resolveTheme,
    THEME_PREFERENCE_KEY,
    type ThemePreference,
} from '#/lib/theme';

interface ThemeContextValue {
    /** The concrete scheme to put on `data-theme`. Never 'system'. */
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemePreference) => void;
    theme: ThemePreference;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Dashboard-scoped theme provider. The preference (system/light/dark) is the single
 * source of truth, stored in one cookie so the server can render the right theme on
 * the /app wrapper. Public pages stay dark and never mount this.
 *
 * `system` is resolved to a concrete scheme here rather than in CSS: the stylesheet
 * then needs only one `[data-theme='light']` block, and `data-theme` never carries a
 * value that matches no selector.
 */
export function ThemeProvider({
    children,
    initialTheme,
}: {
    children: ReactNode;
    initialTheme: ThemePreference;
}) {
    const [theme, setThemeState] = useState<ThemePreference>(initialTheme);

    // The server cannot read the OS, so it renders dark for 'system' and the client
    // corrects on hydration. Subscribing here also picks up a mid-session OS switch.
    const resolvedTheme = useSyncExternalStore(
        subscribeToScheme,
        () => resolveTheme(theme),
        () => (theme === 'system' ? 'dark' : theme),
    );

    const setTheme = (next: ThemePreference) => {
        setThemeState(next);

        if (typeof document !== 'undefined') {
            setPreferenceCookie(THEME_PREFERENCE_KEY, next);
        }
    };

    return (
        <ThemeContext.Provider value={{ resolvedTheme, setTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}

function subscribeToScheme(onChange: () => void) {
    const query = window.matchMedia(LIGHT_SCHEME_QUERY);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
}
