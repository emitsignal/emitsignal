import { Platform } from "react-native";

// Whinsper — purple/violet dark with dev-native monospace accents.
// Dark is the canonical surface; light mode falls back to a softer palette.

export const W = {
    amber: "#fbbf24",
    // Backgrounds
    bg: "#0f0a1a",
    bgChip: "#1f1930",
    bgElev: "#1a1625",
    bgElev2: "#231c33",

    bgLine: "#2a2340",
    cyan: "#67e8f9",
    // Text
    fg: "#f5f0ff",
    fgDim: "#7a6d99",

    fgFaint: "#4a4166",
    fgMuted: "#b8a9d9",
    // Semantic
    green: "#4ade80",
    // Severity dots (priority 1-5)
    p1: "#818cf8",

    p2: "#a78bfa",
    p3: "#c4b5fd",
    p4: "#fbbf24",
    p5: "#f87171",
    pink: "#f0abfc",

    red: "#f87171",
    // Accents
    violet: "#a78bfa",
    violetBg: "rgba(124,58,237,0.12)",
    violetDeep: "#5b21b6",
    violetDim: "#7c3aed",
};

const tintLight = "#7c3aed";
const tintDark = W.violet;

export const Colors = {
    dark: {
        background: W.bg,
        border: W.bgLine,
        cardBackground: W.bgElev,
        error: W.red,
        icon: W.fgDim,
        info: W.cyan,
        success: W.green,
        tabIconDefault: W.fgDim,
        tabIconSelected: tintDark,
        text: W.fg,
        tint: tintDark,
        warning: W.amber,
    },
    light: {
        background: "#f5f3ff",
        border: "#e0d6f5",
        cardBackground: "#ffffff",
        error: W.red,
        icon: "#7a6d99",
        info: W.cyan,
        success: W.green,
        tabIconDefault: "#9b8fb8",
        tabIconSelected: tintLight,
        text: "#1a1625",
        tint: tintLight,
        warning: W.amber,
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
        full: 9999,
        large: 14,
        medium: 10,
        small: 6,
    },
    shadow: {
        large: {
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
        },
        medium: {
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { height: 2, width: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
        },
        small: {
            elevation: 2,
            shadowColor: "#000",
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
        mono: "monospace",
        rounded: "normal",
        sans: "normal",
        serif: "serif",
    },
    ios: {
        mono: "ui-monospace",
        rounded: "ui-rounded",
        sans: "system-ui",
        serif: "ui-serif",
    },
    web: {
        mono: "'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
        sans: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
    },
});
