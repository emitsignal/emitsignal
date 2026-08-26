import { parsePlaceholder } from '@emitsignal/shared/webhook-template';
import { isKnownTransform } from '@emitsignal/shared/webhook-transforms';

import type { WebhookTemplate } from '#/lib/api';

export interface ReplacementRow {
    from: string;
    to: string;
}

export type TemplateTextField = Exclude<keyof WebhookTemplate, 'replacements'>;

export const TEMPLATE_FIELDS = ['title', 'body', 'tags', 'link'] as const;

export const EMPTY_TEMPLATE: WebhookTemplate = {
    body: '',
    link: '',
    linkLabel: '',
    priority: '3',
    replacements: {},
    tags: '',
    title: '',
};

const PLACEHOLDER_HINTS: Record<(typeof TEMPLATE_FIELDS)[number], string> = {
    body: 'event.description',
    link: 'event.url',
    tags: 'source, tag',
    title: 'event.type',
};

export function placeholderHintFor(field: (typeof TEMPLATE_FIELDS)[number]): string {
    return `{{${PLACEHOLDER_HINTS[field]}}}`;
}

export function toReplacementMap(rows: ReplacementRow[]): Record<string, string> {
    return Object.fromEntries(
        rows.filter((row) => row.from.trim()).map((row) => [row.from, row.to]),
    );
}

export function toReplacementRows(
    replacements: Record<string, string> | undefined,
): ReplacementRow[] {
    return Object.entries(replacements ?? {}).map(([from, to]) => ({ from, to }));
}

// Filters are ignored at delivery time when misspelled, so the editor is where a typo surfaces.
export function unknownFiltersIn(input: string): string[] {
    const names = [...input.matchAll(/\{\{\s*([^}]+)\s*\}\}/g)].flatMap(([, raw]) =>
        parsePlaceholder(raw!).filters.map((filter) => filter.name),
    );

    return [...new Set(names.filter((name) => !isKnownTransform(name)))];
}
