import { useMemo } from 'react';

import { type Palette } from '@/constants/theme';
import { usePalette } from '@/hooks/use-palette';

/**
 * Resolves the active palette and memoizes a `createStyles(palette)` factory in a
 * single call, returning both. Replaces the two-line
 * `usePalette()` + `useMemo(() => createStyles(palette), [palette])` boilerplate.
 *
 *   const { palette, styles } = useThemedStyles(createStyles);
 */
export function useThemedStyles<T>(createStyles: (palette: Palette) => T): {
    palette: Palette;
    styles: T;
} {
    const palette = usePalette();
    const styles = useMemo(() => createStyles(palette), [createStyles, palette]);
    return { palette, styles };
}
