export type ResolvedTheme = 'dark' | 'light';

export type ThemePreference = 'dark' | 'light' | 'system';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';
export const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)';
export const THEME_PREFERENCE_KEY = '@emitsignal/theme';

export function isThemePreference(value: unknown): value is ThemePreference {
    return value === 'dark' || value === 'light' || value === 'system';
}

export function readThemePreferenceFromDocument(): ThemePreference {
    if (typeof document === 'undefined') {
        return DEFAULT_THEME_PREFERENCE;
    }

    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');

        if (name === THEME_PREFERENCE_KEY) {
            const value = rest.join('=');

            return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
        }
    }

    return DEFAULT_THEME_PREFERENCE;
}

/**
 * Collapses a preference into the scheme actually rendered. `system` needs the OS,
 * which the server cannot know, so SSR resolves it to dark and the client corrects
 * it on hydration (see ThemeProvider).
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference !== 'system') {
        return preference;
    }

    if (typeof window === 'undefined') {
        return 'dark';
    }

    return window.matchMedia(LIGHT_SCHEME_QUERY).matches ? 'light' : 'dark';
}
