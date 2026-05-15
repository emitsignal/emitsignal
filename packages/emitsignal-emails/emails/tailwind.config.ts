import { pixelBasedPreset, type TailwindConfig } from 'react-email';

export default {
    presets: [pixelBasedPreset],
    theme: {
        extend: {
            colors: {
                'es-amber': '#fbbf24',
                'es-bg': '#0f0a1a',
                'es-bgChip': '#1f1930',
                'es-bgElev': '#1a1625',
                'es-bgElev2': '#231c33',
                'es-bgLine': '#2a2340',
                'es-cyan': '#67e8f9',
                'es-fg': '#f5f0ff',
                'es-fgDim': '#7a6d99',
                'es-fgFaint': '#4a4166',
                'es-fgMuted': '#b8a9d9',
                'es-green': '#4ade80',
                'es-p1': '#818cf8',
                'es-p2': '#a78bfa',
                'es-p3': '#c4b5fd',
                'es-p4': '#fbbf24',
                'es-p5': '#f87171',
                'es-pink': '#f0abfc',
                'es-red': '#f87171',
                'es-violet': '#a78bfa',
                'es-violetBg': 'rgba(124,58,237,0.12)',
                'es-violetDeep': '#5b21b6',
                'es-violetDim': '#7c3aed',
            },
            fontFamily: {
                mono: 'Geist Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                sans: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            },
        },
    },
} satisfies TailwindConfig;

const appStaticAssetsBaseURL =
    process.env.NODE_ENV === 'production'
        ? 'https://emitsignal.com'
        : process.env.APP_STATIC_ASSETS_BASE_URL;

export const brandAssets = {
    logo: {
        alt: 'EmitSignal',
        height: 32,
        src: `${appStaticAssetsBaseURL}/static/logo.png`,
        width: 32,
    },
};
