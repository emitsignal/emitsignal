export interface DebugSections {
    showCurl: boolean;
    showDelivery: boolean;
    showPayload: boolean;
}

/** Cookie + storage key holding the user's debug-section toggles (JSON-encoded). */
export const DEBUG_SECTIONS_KEY = '@emitsignal/debug-sections';

export const DEBUG_SECTIONS_DEFAULTS: DebugSections = {
    showCurl: false,
    showDelivery: false,
    showPayload: false,
};

/** Parses a raw cookie value into DebugSections, merging over defaults. */
export function parseDebugSections(raw: string | undefined): DebugSections {
    if (raw === undefined) {
        return { ...DEBUG_SECTIONS_DEFAULTS };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<DebugSections>;

        return {
            showCurl: parsed.showCurl ?? DEBUG_SECTIONS_DEFAULTS.showCurl,
            showDelivery: parsed.showDelivery ?? DEBUG_SECTIONS_DEFAULTS.showDelivery,
            showPayload: parsed.showPayload ?? DEBUG_SECTIONS_DEFAULTS.showPayload,
        };
    } catch {
        return { ...DEBUG_SECTIONS_DEFAULTS };
    }
}

/** Reads the debug-sections cookie on the client (server uses debug-sections.server.ts). */
export function readDebugSectionsFromDocument(): DebugSections {
    if (typeof document === 'undefined') {
        return { ...DEBUG_SECTIONS_DEFAULTS };
    }

    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');

        if (name === DEBUG_SECTIONS_KEY) {
            return parseDebugSections(decodeURIComponent(rest.join('=')));
        }
    }

    return { ...DEBUG_SECTIONS_DEFAULTS };
}
