/**
 * Fades a color toward transparent.
 *
 * Tints used to be written as a hex alpha suffix (`${color}22`). That silently
 * produces invalid CSS once `color` is a `var(--color-*)` token rather than a
 * literal hex, so every tint has to go through `color-mix` instead.
 */
export function withAlpha(color: string, percent: number): string {
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
