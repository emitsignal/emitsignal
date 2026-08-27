import type { WebhookTemplate } from '#/lib/api';

export type TemplateTextField = keyof WebhookTemplate;

export const TEMPLATE_FIELDS = ['title', 'body', 'tags', 'link'] as const;

export const EMPTY_TEMPLATE: WebhookTemplate = {
    body: '',
    link: '',
    linkLabel: '',
    priority: '3',
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
