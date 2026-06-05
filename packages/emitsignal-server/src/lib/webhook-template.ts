export interface WebhookTemplate {
    body?: string;
    link?: string;
    priority?: string;
    tags?: string;
    title?: string;
}

export function applyTemplate(str: string, data: unknown): string {
    return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path: string) => resolvePath(data, path));
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
    priority: number;
    tags: string[];
    title: string;
} {
    const title = template.title ? applyTemplate(template.title, payload) : 'Webhook delivery';
    const body = template.body ? applyTemplate(template.body, payload) : '';
    const rawTags = template.tags ? applyTemplate(template.tags, payload) : '';
    const tags = rawTags
        ? rawTags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];
    const priority = Math.min(5, Math.max(1, parseInt(template.priority ?? '3', 10))) || 3;
    return { body, priority, tags, title };
}

function resolvePath(obj: unknown, path: string): string {
    const val = path
        .trim()
        .split('.')
        .reduce<unknown>(
            (o, k) =>
                o != null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined,
            obj,
        );
    return val == null ? '' : String(val);
}
