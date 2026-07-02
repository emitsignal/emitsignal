import type { Message } from '@emitsignal/shared';
import type { Command } from 'commander';

import { spawn } from 'node:child_process';

import { createClient } from '../client.ts';
import { getBaseUrl, getDeviceId, getToken } from '../config.ts';
import { arrow, err, formatMessage } from '../output.ts';

export function registerListenCommand(program: Command): void {
    program
        .command('listen')
        .description('Stream live signals over SSE')
        .argument('[topic]', 'Topic or filter expression (default: all subscriptions)')
        .option('--no-color', 'Disable ANSI color output')
        .option('--since <dur>', 'Replay history first then go live (1h, 30m)')
        .option('-c, --channel <glob>', 'Restrict to channels matching a glob (alerts/*)')
        .option('-f, --format <mode>', 'Output format: pretty|json|compact|tsv', 'pretty')
        .option('-p, --priority <expr>', 'Filter by priority (>=2, <5, =4)')
        .option('-s, --sound', 'Emit sounds when receiving a message')
        .option('-t, --tag <tags>', 'Only events with these tags (comma-separated)')
        .option('-x, --exec <cmd>', 'Run shell command for each event ($ES_* env vars)')
        .action(async (topicArg: string | undefined, opts) => {
            const baseUrl = getBaseUrl();
            const client = createClient();
            const token = getToken();

            const priorityFilter = opts.priority
                ? parsePriorityFilter(opts.priority as string)
                : null;

            const tagFilter: null | string[] = opts.tag
                ? (opts.tag as string).split(',').map((s: string) => s.trim())
                : null;

            const since = opts.since
                ? Math.floor((Date.now() - durationToMs(opts.since as string)) / 1000)
                : undefined;

            let url: string;

            if (topicArg) {
                url = client.sseUrl(topicArg, since);
            } else {
                try {
                    const subscriptions = await client.api.listSubscriptions(getDeviceId());
                    const topics = subscriptions.map((subscription) => subscription.topic.name);

                    url = client.sseMultiUrl(topics);
                } catch {
                    url = client.sseMultiUrl([]);
                }
            }

            const filterDesc = opts.priority ? `p${opts.priority}` : 'none';

            arrow(`connected ${baseUrl} · filter:${filterDesc} · ctrl-c to quit`);

            console.log();

            const controller = new AbortController();

            process.on('SIGINT', () => {
                console.log();
                controller.abort();
                process.exit(130);
            });

            try {
                await streamSse(url, token, controller.signal, (msg) => {
                    if (priorityFilter && !priorityFilter(msg.priority)) {
                        return;
                    }

                    if (tagFilter && !tagFilter.some((tag) => msg.tags.includes(tag))) {
                        return;
                    }

                    if (opts.channel) {
                        const topic = msg.topicName ?? '';
                        const pattern = (opts.channel as string).replace(/\*/g, '.*');

                        if (!new RegExp(`^${pattern}$`).test(topic)) {
                            return;
                        }
                    }

                    if (opts.sound) {
                        announce(
                            `New message received from: ${msg.topicName}, ${msg.title} - ${msg.body}. Priority: ${msg.priority}`,
                        );
                    }

                    console.log(formatMessage(msg, opts.format as string));

                    if (opts.exec) {
                        spawn(opts.exec as string, {
                            env: {
                                ...process.env,
                                ES_BODY: msg.body,
                                ES_ID: msg.id,
                                ES_PRIORITY: String(msg.priority),
                                ES_TAGS: msg.tags.join(','),
                                ES_TITLE: msg.title,
                                ES_TOPIC: msg.topicName ?? '',
                            },
                            shell: true,
                            stdio: 'inherit',
                        });
                    }
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    err(error instanceof Error ? error.message : String(error));

                    process.exit(1);
                }
            }
        });
}

function announce(text: string): void {
    if (process.platform === 'darwin') {
        spawn('say', [text], { stdio: 'ignore' }).on('error', bell);

        return;
    }

    if (process.platform === 'win32') {
        // Speak via the built-in SAPI voice through PowerShell. The text is
        // base64-encoded so it can be passed as a single argv entry without
        // any shell quoting/injection concerns.

        const encoded = Buffer.from(text, 'utf16le').toString('base64');

        spawn(
            'powershell',
            [
                '-NoProfile',
                '-Command',
                `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak([System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('${encoded}')))`,
            ],
            { stdio: 'ignore' },
        ).on('error', bell);

        return;
    }

    // Linux/BSD: speech-dispatcher if installed, otherwise fall back to a
    // plain terminal bell so `--sound` still does *something* everywhere.
    spawn('spd-say', [text], { stdio: 'ignore' }).on('error', bell);
}

function bell(): void {
    process.stdout.write('\x07');
}

function durationToMs(dur: string): number {
    const m = dur.match(/^(\d+)(s|m|h|d)$/);

    if (!m) {
        return 0;
    }

    const n = parseInt(m[1]!, 10);

    switch (m[2]) {
        case 'd':
            return n * 86_400_000;
        case 'h':
            return n * 3_600_000;
        case 'm':
            return n * 60_000;
        case 's':
            return n * 1_000;
        default:
            return 0;
    }
}

function parsePriorityFilter(expr: string): (p: number) => boolean {
    const m = expr.match(/^([><=!]{1,2})(\d)$/);
    if (!m) return () => true;

    const n = parseInt(m[2]!, 10);

    switch (m[1]) {
        case '<':
            return (p) => p < n;
        case '<=':
            return (p) => p <= n;
        case '=':
        case '==':
            return (p) => p === n;
        case '>':
            return (p) => p > n;
        case '>=':
            return (p) => p >= n;
        default:
            return () => true;
    }
}

async function streamSse(
    url: string,
    token: string | undefined,
    signal: AbortSignal,
    onEvent: (msg: Message) => void,
): Promise<void> {
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers, signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (!response.body) throw new Error('no response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');

        buffer = parts.pop() ?? '';

        for (const part of parts) {
            for (const line of part.split('\n')) {
                if (line.startsWith('data: ')) {
                    try {
                        onEvent(JSON.parse(line.slice(6)) as Message);
                    } finally {
                        //
                    }
                }
            }
        }
    }
}
