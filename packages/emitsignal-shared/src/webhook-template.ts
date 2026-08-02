import type { WebhookTemplate } from './api.ts';

// Labels interpolate payload values on a public endpoint, so the text is untrusted.
export const MAX_LINK_LABEL_LENGTH = 40;

export function applyTemplate(input: string, payload: unknown, defaultValue = ''): string {
    return input.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path: string) =>
        formatValue(resolvePath(payload, path.trim().split('.')), defaultValue),
    );
}

export function normalizeLinkLabel(label: string): string {
    return label.replace(/\s+/g, ' ').trim().slice(0, MAX_LINK_LABEL_LENGTH).trim();
}

export function parseTemplate(raw: null | string): null | WebhookTemplate {
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as WebhookTemplate;
    } catch {
        return null;
    }
}

export function renderTemplate(
    template: WebhookTemplate,
    payload: unknown,
): {
    body: string;
    link: string;
    linkLabel: string;
    priority: number;
    tags: string[];
    title: string;
} {
    const title = template.title ? applyTemplate(template.title, payload) : 'Webhook delivery';
    const body = template.body ? applyTemplate(template.body, payload) : '';
    // An unset link, or one whose template path does not resolve, renders to ''.
    // Callers treat that as "no action" — a link is never required for delivery.
    const link = template.link ? applyTemplate(template.link, payload).trim() : '';
    const linkLabel =
        link && template.linkLabel
            ? normalizeLinkLabel(applyTemplate(template.linkLabel, payload))
            : '';
    const rawTags = template.tags ? applyTemplate(template.tags, payload) : '';
    const tags = rawTags
        ? rawTags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
        : [];

    const priority = Math.min(5, Math.max(1, parseInt(template.priority ?? '3', 10))) || 3;

    return { body, link, linkLabel, priority, tags, title };
}

function formatValue(value: unknown, emptyValue: string): string {
    if (value == null) {
        return emptyValue;
    }

    if (Array.isArray(value)) {
        const items = value.flat(Infinity).filter((item) => item != null);
        return items.length ? items.map((item) => String(item)).join(', ') : emptyValue;
    }

    return String(value);
}

function resolvePath(value: unknown, segments: string[]): unknown {
    if (segments.length === 0) {
        return value;
    }

    const [head, ...rest] = segments;

    if (head === '*') {
        return Array.isArray(value) ? value.map((item) => resolvePath(item, rest)) : undefined;
    }

    if (value != null && typeof value === 'object') {
        return resolvePath((value as Record<string, unknown>)[head], rest);
    }

    return undefined;
}
