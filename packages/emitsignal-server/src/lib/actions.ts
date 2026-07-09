import { isValidHref } from './media-refs';

export interface Action {
    label?: string;
    type: 'acknowledge' | 'view';
    url?: string;
}

export function validateActions(raw: unknown): { actions: Action[]; ok: true } | { error: string } {
    if (!Array.isArray(raw) || raw.length === 0) {
        return { actions: [], ok: true };
    }

    if (raw.length > 2) {
        return { error: 'actions: max 2 allowed' };
    }

    const actions: Action[] = [];
    let hasAcknowledge = false;
    const seenUrls = new Set<string>();

    for (const item of raw) {
        if (typeof item !== 'object' || item === null) {
            return { error: 'actions: each action must be an object' };
        }
        const action = item as Record<string, unknown>;

        if (action.type === 'acknowledge') {
            if (hasAcknowledge) {
                return { error: 'actions: only one acknowledge action allowed' };
            }

            hasAcknowledge = true;

            actions.push({
                label: typeof action.label === 'string' ? action.label : 'Acknowledge',
                type: 'acknowledge',
            });
        } else if (action.type === 'view') {
            if (typeof action.url !== 'string' || !action.url) {
                return { error: 'actions: view action requires a url' };
            }

            // Only http(s) links may be stored
            if (!isValidHref(action.url)) {
                return { error: 'actions: view url must be http(s)' };
            }

            if (seenUrls.has(action.url)) {
                return { error: 'actions: duplicate view url not allowed' };
            }

            seenUrls.add(action.url);

            actions.push({
                label: typeof action.label === 'string' ? action.label : 'View',
                type: 'view',
                url: action.url,
            });
        } else {
            return { error: `actions: unknown type "${String(action.type)}"` };
        }
    }

    return { actions, ok: true };
}
