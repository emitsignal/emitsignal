export type ThemePreference = 'dark' | 'light' | 'system';

/** Cookie + storage key holding the user's theme preference. */
export const THEME_PREFERENCE_KEY = '@emitsignal/theme';

export function isThemePreference(value: unknown): value is ThemePreference {
    return value === 'dark' || value === 'light' || value === 'system';
}

/** Reads the preference cookie on the client (server uses theme.server.ts). */
export function readThemePreferenceFromDocument(): ThemePreference {
    if (typeof document === 'undefined') {
        return 'system';
    }

    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');

        if (name === THEME_PREFERENCE_KEY) {
            const value = rest.join('=');

            return isThemePreference(value) ? value : 'system';
        }
    }

    return 'system';
}
