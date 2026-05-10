import { pixelBasedPreset, type TailwindConfig } from "react-email";

export default {
    presets: [pixelBasedPreset],
    theme: {
        extend: {
            colors: {
                "es-bg": "#0f0a1a",
                "es-bgElev": "#1a1625",
                "es-bgElev2": "#231c33",
                "es-bgLine": "#2a2340",
                "es-bgChip": "#1f1930",
                "es-fg": "#f5f0ff",
                "es-fgMuted": "#b8a9d9",
                "es-fgDim": "#7a6d99",
                "es-fgFaint": "#4a4166",
                "es-violet": "#a78bfa",
                "es-violetBg": "rgba(124,58,237,0.12)",
                "es-violetDim": "#7c3aed",
                "es-violetDeep": "#5b21b6",
                "es-cyan": "#67e8f9",
                "es-green": "#4ade80",
                "es-red": "#f87171",
                "es-amber": "#fbbf24",
                "es-pink": "#f0abfc",
                "es-p1": "#818cf8",
                "es-p2": "#a78bfa",
                "es-p3": "#c4b5fd",
                "es-p4": "#fbbf24",
                "es-p5": "#f87171",
            },
            fontFamily: {
                mono: "Geist Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                sans: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            },
        },
    },
} satisfies TailwindConfig;

export const brandAssets = {
    logo: {
        src: `${process.env.NODE_ENV === "production" ? "https://emitsignal.com" : ""}/static/logo.png`,
        alt: "Emit Signal",
        width: 32,
        height: 32,
    },
};
