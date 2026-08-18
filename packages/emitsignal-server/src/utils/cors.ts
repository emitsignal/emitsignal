export const ALLOWED_METHODS = 'DELETE, GET, POST, PUT, OPTIONS, PATCH';

export const APP_ALLOWED_HEADERS = 'Content-Type, Authorization';

export const PUBLIC_PUBLISH_ALLOWED_HEADERS = [
    'Actions',
    'At',
    'Authorization',
    'Banner',
    'Content-Type',
    'Delay',
    'In',
    'Inline-Attachments',
    'Inline-Images',
    'M',
    'Message',
    'P',
    'Prio',
    'Priority',
    'T',
    'Ta',
    'Tags',
    'Title',
    'X-Actions',
    'X-Api-Key',
    'X-At',
    'X-Banner',
    'X-Delay',
    'X-In',
    'X-Inline-Attachments',
    'X-Inline-Images',
    'X-Message',
    'X-Priority',
    'X-Tags',
    'X-Title',
].join(', ');

export const EXPOSED_HEADERS = [
    'Deprecation',
    'Link',
    'Retry-After',
    'X-Quota-Limit',
    'X-Quota-Remaining',
    'X-Quota-Reset',
].join(', ');

const PUBLIC_PUBLISH_PATH = /^\/(publish|topic)\/.+/;

export function isPublicPublishPath(pathname: string): boolean {
    return PUBLIC_PUBLISH_PATH.test(pathname);
}

export function normalizeOrigin(value: string): string {
    return value.replace(/\/+$/, '');
}
