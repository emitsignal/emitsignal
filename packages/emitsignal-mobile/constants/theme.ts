import { Platform } from 'react-native';

export { PRIORITY_HEX as PriorityColors } from '@emitsignal/shared/priority';

// Two full palettes sharing identical keys. Components read the active one at
// render time via `usePalette()`; the scheme is resolved by the ThemeProvider.

export const darkPalette = {
    amber: '#fbbf24',
    bg: '#000000',
    bgChip: '#141517',
    bgCode: '#0a0a0c',
    bgElev: '#111113',
    bgElev2: '#191a1d',
    bgLine: '#232427',
    // Control overlay on the media lightbox (sits on a black backdrop)
    controlOverlay: 'rgba(255,255,255,0.12)',
    cyan: '#67e8f9',
    // Semantic tint backgrounds
    dangerBg: 'rgba(248,113,113,0.10)',
    // Text
    fg: '#f7f7f8',
    fgDim: '#71717a',
    fgFaint: '#3f3f46',
    fgMuted: '#a1a1a6',
    // Semantic
    green: '#4ade80',
    infoBg: 'rgba(103,232,249,0.12)',
    link: '#67e8f9',
    // Fullscreen media backdrop
    mediaBackdrop: 'rgba(0,0,0,0.88)',
    // Severity dots (priority 1-5)
    p1: '#818cf8',
    p2: '#a78bfa',
    p3: '#c4b5fd',
    p4: '#fbbf24',
    p5: '#f87171',
    pink: '#f0abfc',
    red: '#f87171',
    // Dialog scrim
    scrim: 'rgba(3,3,4,0.72)',
    skeleton: '#191a1d',
    // Accents
    violet: '#a78bfa',
    violetBg: 'rgba(124,58,237,0.12)',
    violetDeep: '#5b21b6',
    violetDim: '#7c3aed',
    warningBg: 'rgba(251,191,36,0.13)',
};

export type Palette = typeof darkPalette;

export const lightPalette: Palette = {
    amber: '#d97706',
    // Backgrounds — neutral greys, mirroring the website's [data-theme='light']
    bg: '#fafafa',
    bgChip: '#ebebed',
    bgCode: '#f4f4f5',
    bgElev: '#ffffff',
    bgElev2: '#f4f4f5',
    bgLine: '#e4e4e7',
    controlOverlay: 'rgba(255,255,255,0.12)',
    cyan: '#0891b2',
    dangerBg: 'rgba(220,38,38,0.08)',
    // Text (darkest = primary, lightening toward faint)
    fg: '#18181b',
    fgDim: '#71717a',
    fgFaint: '#a1a1a6',
    fgMuted: '#52525b',
    // Semantic
    green: '#16a34a',
    infoBg: 'rgba(8,145,178,0.10)',
    link: '#0891b2',
    mediaBackdrop: 'rgba(0,0,0,0.88)',
    // Severity dots (priority 1-5)
    p1: '#6366f1',
    p2: '#7c3aed',
    p3: '#9333ea',
    p4: '#d97706',
    p5: '#dc2626',
    pink: '#c026d3',
    red: '#dc2626',
    scrim: 'rgba(24,24,27,0.45)',
    skeleton: '#e4e4e7',
    // Accents
    violet: '#7c3aed',
    violetBg: 'rgba(124,58,237,0.10)',
    violetDeep: '#5b21b6',
    violetDim: '#6d28d9',
    warningBg: 'rgba(217,119,6,0.12)',
};

export const palettes: Record<'dark' | 'light', Palette> = {
    dark: darkPalette,
    light: lightPalette,
};

// Static dark palette: alias kept for pre-theme contexts (the splash screen
// paints before the theme is resolved) and as a non-reactive fallback.
export const W = darkPalette;

export const Colors = {
    dark: {
        background: darkPalette.bg,
        border: darkPalette.bgLine,
        cardBackground: darkPalette.bgElev,
        error: darkPalette.red,
        icon: darkPalette.fgDim,
        info: darkPalette.cyan,
        success: darkPalette.green,
        tabIconDefault: darkPalette.fgDim,
        tabIconSelected: darkPalette.violet,
        text: darkPalette.fg,
        tint: darkPalette.violet,
        warning: darkPalette.amber,
    },
    light: {
        background: lightPalette.bg,
        border: lightPalette.bgLine,
        cardBackground: lightPalette.bgElev,
        error: lightPalette.red,
        icon: lightPalette.fgDim,
        info: lightPalette.cyan,
        success: lightPalette.green,
        tabIconDefault: lightPalette.fgDim,
        tabIconSelected: lightPalette.violet,
        text: lightPalette.fg,
        tint: lightPalette.violet,
        warning: lightPalette.amber,
    },
};

export const UI = {
    borderRadius: {
        full: 9999,
        large: 14,
        medium: 10,
        small: 6,
    },
    shadow: {
        large: {
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
        },
        medium: {
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { height: 2, width: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
        },
        small: {
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { height: 1, width: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
    },
    spacing: {
        lg: 16,
        md: 12,
        sm: 8,
        xl: 20,
        xs: 4,
        xxl: 24,
    },
};

export const Fonts = Platform.select({
    default: {
        mono: 'monospace',
        rounded: 'normal',
        sans: 'normal',
        serif: 'serif',
    },
    ios: {
        mono: 'ui-monospace',
        rounded: 'ui-rounded',
        sans: 'system-ui',
        serif: 'ui-serif',
    },
    web: {
        mono: "'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
        sans: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
    },
});
