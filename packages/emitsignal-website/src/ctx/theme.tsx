import { createContext, type ReactNode, useContext, useState } from 'react';

import { setPreferenceCookie } from '#/lib/cookies';
import { THEME_PREFERENCE_KEY, type ThemePreference } from '#/lib/theme';

interface ThemeContextValue {
    setTheme: (theme: ThemePreference) => void;
    theme: ThemePreference;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Dashboard-scoped theme provider. The preference (system/light/dark) is the
 * single source of truth, stored in one cookie so the server can render the
 * correct `data-theme` on first paint (no flash). CSS resolves `system` against
 * the OS via a media query, so no client-side scheme math is needed.
 */
export function ThemeProvider({
    children,
    initialTheme,
}: {
    children: ReactNode;
    initialTheme: ThemePreference;
}) {
    const [theme, setThemeState] = useState<ThemePreference>(initialTheme);

    const setTheme = (next: ThemePreference) => {
        setThemeState(next);

        if (typeof document !== 'undefined') {
            setPreferenceCookie(THEME_PREFERENCE_KEY, next);
        }
    };

    return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}
