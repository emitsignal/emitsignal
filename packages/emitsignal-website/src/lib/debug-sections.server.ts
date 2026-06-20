import { getCookie } from '@tanstack/react-start/server';

import { DEBUG_SECTIONS_KEY, type DebugSections, parseDebugSections } from '#/lib/debug-sections';

/**
 * Reads the debug-section toggles from the request cookie so the initial render
 * matches the persisted choice (no flash). Missing keys fall back to defaults.
 */
export function getDebugSections(): DebugSections {
    return parseDebugSections(getCookie(DEBUG_SECTIONS_KEY));
}
