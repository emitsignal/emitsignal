export type SidebarState = 'collapsed' | 'expanded';

/** Cookie key holding the user's desktop sidebar collapse preference. */
export const SIDEBAR_STATE_KEY = '@emitsignal/sidebar';

export function isSidebarState(value: unknown): value is SidebarState {
    return value === 'collapsed' || value === 'expanded';
}

/** Reads the sidebar cookie on the client (server uses sidebar.server.ts). */
export function readSidebarStateFromDocument(): SidebarState {
    if (typeof document === 'undefined') {
        return 'expanded';
    }

    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');

        if (name === SIDEBAR_STATE_KEY) {
            const value = rest.join('=');

            return isSidebarState(value) ? value : 'expanded';
        }
    }

    return 'expanded';
}
