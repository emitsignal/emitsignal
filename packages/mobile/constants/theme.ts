import { Platform } from "react-native";

// Whinsper — purple/violet dark with dev-native monospace accents.
// Dark is the canonical surface; light mode falls back to a softer palette.

export const W = {
    // Backgrounds
    bg: "#0f0a1a",
    bgElev: "#1a1625",
    bgElev2: "#231c33",
    bgLine: "#2a2340",
    bgChip: "#1f1930",

    // Text
    fg: "#f5f0ff",
    fgMuted: "#b8a9d9",
    fgDim: "#7a6d99",
    fgFaint: "#4a4166",

    // Accents
    violet: "#a78bfa",
    violetDim: "#7c3aed",
    violetDeep: "#5b21b6",
    violetBg: "rgba(124,58,237,0.12)",

    // Semantic
    green: "#4ade80",
    amber: "#fbbf24",
    red: "#f87171",
    cyan: "#67e8f9",
    pink: "#f0abfc",

    // Severity dots (priority 1-5)
    p1: "#818cf8",
    p2: "#a78bfa",
    p3: "#c4b5fd",
    p4: "#fbbf24",
    p5: "#f87171",
};

const tintLight = "#7c3aed";
const tintDark = W.violet;

export const Colors = {
    light: {
        text: "#1a1625",
        background: "#f5f3ff",
        cardBackground: "#ffffff",
        tint: tintLight,
        icon: "#7a6d99",
        tabIconDefault: "#9b8fb8",
        tabIconSelected: tintLight,
        border: "#e0d6f5",
        success: W.green,
        warning: W.amber,
        error: W.red,
        info: W.cyan,
    },
    dark: {
        text: W.fg,
        background: W.bg,
        cardBackground: W.bgElev,
        tint: tintDark,
        icon: W.fgDim,
        tabIconDefault: W.fgDim,
        tabIconSelected: tintDark,
        border: W.bgLine,
        success: W.green,
        warning: W.amber,
        error: W.red,
        info: W.cyan,
    },
};

// Priority dot colors — match the design's 5-level scale.
export const PriorityColors = {
    1: W.p1,
    2: W.p2,
    3: W.p3,
    4: W.p4,
    5: W.p5,
} as const;

export const UI = {
    borderRadius: {
        small: 6,
        medium: 10,
        large: 14,
        full: 9999,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
    },
    shadow: {
        small: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        medium: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
        },
        large: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
        },
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: "system-ui",
        serif: "ui-serif",
        rounded: "ui-rounded",
        mono: "ui-monospace",
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace",
    },
    web: {
        sans: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded:
            "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
        mono: "'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
});
