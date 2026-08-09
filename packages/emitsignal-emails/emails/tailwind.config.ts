import { pixelBasedPreset, type TailwindConfig } from 'react-email';

export default {
    presets: [pixelBasedPreset],
    theme: {
        extend: {
            colors: {
                'es-amber': '#fbbf24',
                'es-bg': '#08080a',
                'es-bgChip': '#141517',
                'es-bgElev': '#111113',
                'es-bgElev2': '#191a1d',
                'es-bgLine': '#232427',
                'es-cyan': '#67e8f9',
                'es-fg': '#f7f7f8',
                'es-fgDim': '#71717a',
                'es-fgFaint': '#3f3f46',
                'es-fgMuted': '#a1a1a6',
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

const appStaticAssetsBaseURL = process.env.APP_STATIC_ASSETS_BASE_URL ?? 'https://emitsignal.com';

export const brandAssets = {
    logo: {
        alt: 'EmitSignal',
        height: 32,
        src: `${appStaticAssetsBaseURL}/static/logo.svg`,
        width: 32,
    },
};
