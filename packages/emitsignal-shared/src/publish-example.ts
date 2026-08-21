import type { Action } from './api.ts';

import { publishUrl } from './topic.ts';

export interface CliExampleOptions {
    message?: PublishExampleMessage;
    topicName: string;
}

export interface CurlExampleOptions {
    apiKey?: string;
    baseUrl: string;
    message?: PublishExampleMessage;
    style?: PublishExampleStyle;
    topicName: string;
}

export interface PublishExampleMessage {
    actions?: Action[];
    body?: string;
    priority?: number;
    tags?: string[];
    title?: string;
}

export type PublishExampleStyle = 'headers' | 'json';

const DEFAULT_PRIORITY = 3;

const CONTINUATION = ' \\\n  ';

export function buildCliExample({ message = {}, topicName }: CliExampleOptions): string {
    const parts = [`emitsignal publish ${topicName}`];

    if (message.body) {
        parts.push(doubleQuote(message.body));
    }

    if (message.priority && message.priority !== DEFAULT_PRIORITY) {
        parts.push(`-p${message.priority}`);
    }

    if (message.title && message.title !== message.body) {
        parts.push(`-T ${doubleQuote(message.title)}`);
    }

    if (message.tags?.length) {
        parts.push(`-t ${doubleQuote(message.tags.join(','))}`);
    }

    return parts.join(' ');
}

export function buildCurlExample({
    apiKey,
    baseUrl,
    message = {},
    style = 'json',
    topicName,
}: CurlExampleOptions): string {
    const url = publishUrl(baseUrl, topicName);

    if (style === 'headers') {
        return buildHeaderStyleCurl(url, apiKey, message);
    }

    return buildJsonStyleCurl(url, apiKey, message);
}

function authorizationHeader(apiKey: string | undefined): string[] {
    if (!apiKey) {
        return [];
    }

    return [`-H ${doubleQuote(`Authorization: Bearer ${apiKey}`)}`];
}

function buildHeaderStyleCurl(
    url: string,
    apiKey: string | undefined,
    message: PublishExampleMessage,
): string {
    const headers = authorizationHeader(apiKey);

    if (message.title) {
        headers.push(`-H ${doubleQuote(`title: ${message.title}`)}`);
    }

    if (message.priority) {
        headers.push(`-H ${doubleQuote(`x-priority: ${message.priority}`)}`);
    }

    if (message.tags?.length) {
        headers.push(`-H ${doubleQuote(`x-tags: ${message.tags.join(',')}`)}`);
    }

    const command = `curl -d ${doubleQuote(message.body ?? '')}`;

    if (headers.length === 0) {
        return `${command} ${url}`;
    }

    return [command, ...headers, url].join(CONTINUATION);
}

function buildJsonStyleCurl(
    url: string,
    apiKey: string | undefined,
    message: PublishExampleMessage,
): string {
    const payload = jsonPayload(message);
    const lines = [`curl -X POST ${url}`, ...authorizationHeader(apiKey)];

    if (payload) {
        lines.push(
            `-H ${doubleQuote('Content-Type: application/json')}`,
            `-d ${singleQuote(payload)}`,
        );
    }

    return lines.join(CONTINUATION);
}

// Shell-safe double quoting: the interpolated title/body come from user content,
// so a bare `"` or `$` would otherwise break the command the user pastes.
function doubleQuote(value: string): string {
    return `"${value.replace(/(["$\\`])/g, '\\$1')}"`;
}

function jsonPayload(message: PublishExampleMessage): null | string {
    const payload: Record<string, unknown> = {};

    if (message.title) {
        payload.title = message.title;
    }

    if (message.body) {
        payload.body = message.body;
    }

    if (message.priority) {
        payload.priority = message.priority;
    }

    if (message.tags?.length) {
        payload.tags = message.tags;
    }

    if (message.actions?.length) {
        payload.actions = message.actions;
    }

    if (Object.keys(payload).length === 0) {
        return null;
    }

    return JSON.stringify(payload);
}

// A single-quoted shell word cannot contain an escaped quote; it has to be
// closed, given a literal quote, and reopened.
function singleQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
