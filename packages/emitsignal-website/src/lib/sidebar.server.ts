import { getCookie } from '@tanstack/react-start/server';

import { isSidebarState, SIDEBAR_STATE_KEY, type SidebarState } from '#/lib/sidebar';

/**
 * Reads the sidebar collapse preference from the request cookie so the rail
 * renders collapsed on first paint instead of flashing wide. Defaults to
 * 'expanded'.
 */
export function getSidebarState(): SidebarState {
    const value = getCookie(SIDEBAR_STATE_KEY);

    return isSidebarState(value) ? value : 'expanded';
}
