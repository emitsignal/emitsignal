import type { WebhookTemplate } from './api.ts';
import type { TemplateFilter } from './webhook-transforms.ts';

import { applyFilters } from './webhook-transforms.ts';

// Labels interpolate payload values on a public endpoint, so the text is untrusted.
export const MAX_LINK_LABEL_LENGTH = 40;

// The dictionary rides inside the template column and is read on every delivery.
export const MAX_REPLACEMENT_ENTRIES = 100;

export interface ApplyTemplateOptions {
    defaultValue?: string;
    replacements?: Record<string, string>;
}

export interface ParsedPlaceholder {
    filters: TemplateFilter[];
    path: string;
}

export function applyTemplate(
    input: string,
    payload: unknown,
    options: ApplyTemplateOptions = {},
): string {
    const { defaultValue = '', replacements } = options;

    return input.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, raw: string) => {
        const { filters, path } = parsePlaceholder(raw);
        const resolved = resolvePath(payload, path.split('.'));

        return formatValue(applyFilters(resolved, filters, { replacements }), defaultValue);
    });
}

export function normalizeLinkLabel(label: string): string {
    return label.replace(/\s+/g, ' ').trim().slice(0, MAX_LINK_LABEL_LENGTH).trim();
}

// Splits `path | name:'arg','arg' | name` into its parts. Arguments are single-quoted
// and may legally contain `|`, `:`, `,` and `.`, so every split is quote-aware.
export function parsePlaceholder(raw: string): ParsedPlaceholder {
    const [pathSegment = '', ...filterSegments] = splitUnquoted(raw, '|');

    return {
        filters: filterSegments
            .map(parseFilter)
            .filter((filter): filter is TemplateFilter => filter !== null),
        path: pathSegment.trim(),
    };
}

export function parseTemplate(raw: null | string): null | WebhookTemplate {
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as WebhookTemplate;

        return { ...parsed, replacements: sanitizeReplacements(parsed.replacements) };
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
    const options: ApplyTemplateOptions = {
        replacements: sanitizeReplacements(template.replacements),
    };

    const title = template.title
        ? applyTemplate(template.title, payload, options)
        : 'Webhook delivery';
    const body = template.body ? applyTemplate(template.body, payload, options) : '';
    // An unset link, or one whose template path does not resolve, renders to ''.
    // Callers treat that as "no action" — a link is never required for delivery.
    const link = template.link ? applyTemplate(template.link, payload, options).trim() : '';
    const linkLabel =
        link && template.linkLabel
            ? normalizeLinkLabel(applyTemplate(template.linkLabel, payload, options))
            : '';
    const rawTags = template.tags ? applyTemplate(template.tags, payload, options) : '';
    const tags = rawTags
        ? rawTags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
        : [];

    const priority = Math.min(5, Math.max(1, parseInt(template.priority ?? '3', 10))) || 3;

    return { body, link, linkLabel, priority, tags, title };
}

export function sanitizeReplacements(value: unknown): Record<string, string> | undefined {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([key, entry]) => key !== '' && typeof entry === 'string')
        .slice(0, MAX_REPLACEMENT_ENTRIES) as [string, string][];

    return entries.length ? Object.fromEntries(entries) : undefined;
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

function parseFilter(segment: string): null | TemplateFilter {
    const [namePart = '', ...argParts] = splitUnquoted(segment, ':');
    const name = namePart.trim();

    if (!name) {
        return null;
    }

    const rawArgs = argParts.join(':');

    return { args: rawArgs.trim() ? splitUnquoted(rawArgs, ',').map(unquote) : [], name };
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

// An unterminated quote leaves the scanner "inside" it, so the remainder stays one literal part.
function splitUnquoted(input: string, delimiter: string): string[] {
    const parts: string[] = [];
    let current = '';
    let quoted = false;

    for (const character of input) {
        if (character === "'") {
            quoted = !quoted;
            current += character;
            continue;
        }

        if (character === delimiter && !quoted) {
            parts.push(current);
            current = '';
            continue;
        }

        current += character;
    }

    parts.push(current);

    return parts;
}

function unquote(argument: string): string {
    const trimmed = argument.trim();

    if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1);
    }

    return trimmed;
}
