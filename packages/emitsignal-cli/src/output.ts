import type { Message } from '@emitsignal/shared';

import { priorityHex } from '@emitsignal/shared';

const noColor = !!process.env['NO_COLOR'] || !process.stdout.isTTY;

function ansi(code: string, s: string): string {
    return noColor ? s : `\x1b[${code}m${s}\x1b[0m`;
}

export const color = {
    amber: (s: string) => ansi('38;2;251;191;36', s),
    bold: (s: string) => ansi('1', s),
    cyan: (s: string) => ansi('38;2;103;232;249', s),
    fg: (s: string) => ansi('38;2;245;240;255', s),
    fgDim: (s: string) => ansi('38;2;122;109;153', s),
    fgFaint: (s: string) => ansi('38;2;74;65;102', s),
    fgMuted: (s: string) => ansi('38;2;184;169;217', s),
    green: (s: string) => ansi('38;2;74;222;128', s),
    priority(p: number, s: string): string {
        const hex = priorityHex(p);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return ansi(`38;2;${r};${g};${b}`, s);
    },
    red: (s: string) => ansi('38;2;248;113;113', s),
    violet: (s: string) => ansi('38;2;167;139;250', s),
};

export function arrow(msg: string): void {
    console.log(`${color.fgDim('→')} ${msg}`);
}

export function err(msg: string): void {
    console.error(`${color.red('✗')} ${msg}`);
}

export function formatCompact(msg: Message): string {
    return `${formatTime(msg.createdAt)} ${msg.topicName ?? ''} p${msg.priority} ${msg.title}`;
}

export function formatJson(msg: Message): string {
    return JSON.stringify(msg);
}

export function formatMessage(message: Message, format: string): string {
    switch (format) {
        case 'compact':
            return formatCompact(message);
        case 'json':
            return formatJson(message);
        case 'tsv':
            return formatTsv(message);
        default:
            return formatPretty(message);
    }
}

export function formatPretty(message: Message): string {
    const ch = color.fgDim((message.topicName ?? '').padEnd(16));
    const description = message.body ? `  ${color.fgMuted(truncate(message.body, 60))}` : '';
    const dot = color.priority(message.priority, '●');
    const p = color.fgFaint(`p${message.priority}`);
    const t = color.fgFaint(formatTime(message.createdAt));
    const tags =
        message.tags.length > 0
            ? ` ${color.fgDim(message.tags.map((tag) => `#${tag}`).join(' '))}`
            : '';

    const title = color.fg(message.title);

    return `${t}  ${dot}  ${ch}  ${p}  ${title}${tags}${description}`;
}

export function formatTime(ts: number): string {
    const date = new Date(ts);

    return [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
}

export function formatTsv(msg: Message): string {
    return [msg.createdAt, msg.topicName ?? '', msg.priority, msg.title].join('\t');
}

export function ok(msg: string): void {
    console.log(`${color.violet('✓')} ${msg}`);
}

function truncate(s: string, max: number): string {
    const oneLine = s.replace(/\s+/g, ' ').trim();

    return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}
