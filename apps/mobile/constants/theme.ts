/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Modern teal/green theme inspired by ntfy
const tintColorLight = "#393A4A";
const tintColorDark = "#6B6C7E";

export const Colors = {
    light: {
        text: "#2c3e50",
        background: "#f8f9fa",
        cardBackground: "#ffffff",
        tint: tintColorLight,
        icon: "#7f8c8d",
        tabIconDefault: "#95a5a6",
        tabIconSelected: tintColorLight,
        border: "#e1e8ed",
        success: "#27ae60",
        warning: "#f39c12",
        error: "#e74c3c",
        info: "#3498db",
    },
    dark: {
        text: "#ecf0f1",
        background: "#000000",
        cardBackground: "#1C1C1E",
        tint: tintColorDark,
        icon: "#bdc3c7",
        tabIconDefault: "#95a5a6",
        tabIconSelected: tintColorDark,
        border: "#34495e",
        success: "#2ecc71",
        warning: "#f1c40f",
        error: "#e74c3c",
        info: "#3498db",
    },
};

// Priority colors for notifications
export const PriorityColors = {
    1: "#95a5a6", // Min - Gray
    2: "#3498db", // Low - Blue
    3: "#f39c12", // Default - Orange
    4: "#e67e22", // High - Dark Orange
    5: "#e74c3c", // Max/Urgent - Red
};

// UI Constants
export const UI = {
    borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
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
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: "system-ui",
        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: "ui-serif",
        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: "ui-rounded",
        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: "ui-monospace",
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace",
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded:
            "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});
