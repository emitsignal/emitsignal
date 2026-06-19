import { type Palette, palettes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the color palette for the active scheme, resolved at render time.
 * Use this (not the static `W` export) anywhere colors must react to a
 * light/dark switch. Pair with a `createStyles(palette)` factory + `useMemo`.
 */
export function usePalette(): Palette {
    return palettes[useColorScheme()];
}
