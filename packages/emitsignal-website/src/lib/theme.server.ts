import { getCookie } from '@tanstack/react-start/server';

import {
    DEFAULT_THEME_PREFERENCE,
    isThemePreference,
    THEME_PREFERENCE_KEY,
    type ThemePreference,
} from '#/lib/theme';

/**
 * Reads the theme preference from the request cookie so the server can render
 * the correct `data-theme` on first paint (no flash). Defaults to dark.
 */
export function getThemePreference(): ThemePreference {
    const value = getCookie(THEME_PREFERENCE_KEY);

    return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}
