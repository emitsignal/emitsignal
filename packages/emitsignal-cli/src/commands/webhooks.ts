import type { Command } from 'commander';

import { relativeTime } from '@emitsignal/shared';
import { readFileSync } from 'node:fs';

import { getBaseUrl, getToken } from '../config.ts';
import { arrow, color, err, formatTime, ok } from '../output.ts';

interface Delivery {
    channel: string;
    id: string;
    ms: number;
    payload: Record<string, unknown>;
    renderedBody?: string;
    renderedTitle?: string;
    source: string;
    status: number;
    t: number;
    templated: boolean;
}

interface Webhook {
    channel: string;
    count24h: number;
    id: string;
    lastDeliveryAt?: number;
    name: string;
    slug: string;
    source: string;
    status: 'active' | 'error' | 'paused';
    templated: boolean;
}

export function registerWebhooksCommand(program: Command): void {
    const webhooks = program.command('webhooks').description('Manage inbound webhook endpoints');

    webhooks
        .command('create')
        .description('Create a new webhook endpoint')
        .option('--json', 'Machine-readable output')
        .option('-c, --channel <topic>', 'Publish deliveries to this topic')
        .option('-n, --name <label>', 'Human label for the webhook')
        .option('-t, --template <file>', 'Path to a mustache template file')
        .option(
            '-s, --source <type>',
            'Source type (github|grafana|stripe|vercel|custom)',
            'custom',
        )
        .action(async (opts) => {
            try {
                const body: Record<string, string> = {
                    source: (opts.source as string) ?? 'custom',
                };

                if (opts.channel) {
                    body['channel'] = opts.channel as string;
                }

                if (opts.name) {
                    body['name'] = opts.name as string;
                }

                if (opts.template) {
                    body['template'] = readFileSync(opts.template as string, 'utf-8');
                }

                const webhook = await webhookRequest<{ endpointUrl: string } & Webhook>(
                    '/webhooks',
                    {
                        body: JSON.stringify(body),
                        method: 'POST',
                    },
                );

                if (opts.json) {
                    return console.log(JSON.stringify(webhook, null, 2));
                }

                console.log(`  name      ${color.fg(webhook.name)}`);
                console.log(`  source    ${color.fgMuted(webhook.source)}`);
                console.log(`  channel   ${color.fgMuted(webhook.channel)}`);
                console.log(
                    `  endpoint  ${color.amber(webhook.endpointUrl ?? `/h/${webhook.slug}`)}`,
                );
                console.log(
                    `  template  ${webhook.templated ? color.violet('yes') : color.fgDim('no (raw passthrough)')}`,
                );

                ok('webhook created — point your service at the endpoint above');
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    webhooks
        .command('list')
        .description('List all webhook endpoints')
        .option('--json', 'Machine-readable output')
        .action(async (opts) => {
            try {
                const webhooks = await webhookRequest<Webhook[]>('/webhooks');

                if (opts.json) {
                    return console.log(JSON.stringify(webhooks, null, 2));
                }

                for (const webhook of webhooks) {
                    const status =
                        webhook.status === 'active'
                            ? color.green('active')
                            : webhook.status === 'paused'
                              ? color.amber('paused')
                              : color.red('error');

                    const tpl = webhook.templated
                        ? color.violet('templated')
                        : color.fgDim('raw      ');

                    const last = webhook.lastDeliveryAt
                        ? relativeTime(webhook.lastDeliveryAt)
                        : 'never';

                    console.log(
                        `${color.fg(webhook.name.padEnd(20))}  ${color.fgMuted(`/h/${webhook.slug}`.padEnd(14))}  ${color.fgDim(webhook.channel.padEnd(18))}  ${tpl}  ${color.fgFaint(last.padEnd(8))}  ${status}`,
                    );
                }
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    webhooks
        .command('listen')
        .description('Tail all inbound webhook deliveries in real time')
        .option('-s, --source <type>', 'Filter by source (github|grafana|stripe|vercel|custom)')
        .option('--json', 'Machine-readable output')
        .action(async (opts) => {
            try {
                const source = opts.source as string | undefined;
                const filterDesc = source ? `source:${source}` : 'all sources';

                arrow(
                    `tailing webhooks · ● templated · ○ raw · filter:${filterDesc} · ctrl-c to quit`,
                );

                console.log();

                const controller = new AbortController();

                process.on('SIGINT', () => {
                    console.log();
                    controller.abort();
                    process.exit(130);
                });

                const token = getToken();
                const baseUrl = getBaseUrl();
                const url = source
                    ? `${baseUrl}/webhooks/stream?source=${encodeURIComponent(source)}`
                    : `${baseUrl}/webhooks/stream`;

                const headers: Record<string, string> = { Accept: 'text/event-stream' };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(url, { headers, signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`${res.status} ${res.statusText}`);
                }

                if (!res.body) {
                    throw new Error('no response body');
                }

                const reader = res.body.getReader();
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
                                    const delivery = JSON.parse(line.slice(6)) as Delivery;

                                    printDelivery(delivery, opts.json as boolean);
                                } catch {
                                    //
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    err(error instanceof Error ? error.message : String(error));

                    process.exit(1);
                }
            }
        });

    webhooks
        .command('tail <source>')
        .description('Tail deliveries for a specific source (shorthand for listen --source)')
        .option('--format <mode>', 'Output format: pretty|json', 'pretty')
        .option('--last', 'Show the most recent delivery and exit')
        .action(async (source: string, opts) => {
            try {
                if (opts.last) {
                    const delivery = await webhookRequest<Delivery>(
                        `/webhooks/deliveries?source=${encodeURIComponent(source)}&limit=1`,
                    );

                    if (opts.format === 'json') {
                        console.log(JSON.stringify(delivery, null, 2));
                    } else {
                        printDelivery(delivery as unknown as Delivery, false);
                    }

                    return;
                }

                arrow(`tailing ${color.fg(source)} deliveries · ctrl-c to quit`);

                console.log();
                // Reuse the listen SSE stream with source filter
                const controller = new AbortController();

                process.on('SIGINT', () => {
                    console.log();
                    controller.abort();
                    process.exit(130);
                });

                const token = getToken();
                const headers: Record<string, string> = { Accept: 'text/event-stream' };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const url = `${getBaseUrl()}/webhooks/stream?source=${encodeURIComponent(source)}`;
                const res = await fetch(url, { headers, signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`${res.status} ${res.statusText}`);
                }

                if (!res.body) {
                    throw new Error('no response body');
                }

                const reader = res.body.getReader();
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
                                    printDelivery(JSON.parse(line.slice(6)) as Delivery, false);
                                } catch {
                                    //
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    err(error instanceof Error ? error.message : String(error));

                    process.exit(1);
                }
            }
        });

    webhooks
        .command('set-template <id>')
        .description('Attach or replace a template for a webhook endpoint')
        .option('--clear', 'Remove the template (revert to raw passthrough)')
        .option('-f, --file <path>', 'Path to a mustache template file')
        .action(async (id: string, opts) => {
            try {
                if (opts.clear) {
                    await webhookRequest<void>(`/webhooks/${id}/template`, { method: 'DELETE' });

                    return ok(`template cleared — ${color.fgDim(id)} now forwards raw payloads`);
                }

                if (!opts.file) {
                    err('pass --file <path> or --clear');

                    process.exit(1);
                }

                const template = readFileSync(opts.file as string, 'utf-8');
                const result = await webhookRequest<{ rerenderedCount: number }>(
                    `/webhooks/${id}/template`,
                    {
                        body: JSON.stringify({ template }),
                        method: 'PUT',
                    },
                );

                ok(
                    `template saved · ${color.fgMuted(String(result.rerenderedCount))} deliveries now pretty-print on replay`,
                );
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    webhooks
        .command('delete <id>')
        .description('Delete a webhook endpoint')
        .action(async (id: string) => {
            try {
                await webhookRequest<void>(`/webhooks/${id}`, { method: 'DELETE' });

                ok(`deleted webhook ${color.fgDim(id)}`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function inlineJson(obj: Record<string, unknown>): string {
    return color.fgDim(JSON.stringify(obj).slice(0, 120));
}

function printDelivery(d: Delivery, asJson: boolean): void {
    if (asJson) {
        console.log(JSON.stringify(d));
        return;
    }

    const ch = color.fgDim((d.channel ?? '').padEnd(18));
    const dot = d.templated ? color.violet('●') : color.fgDim('○');
    const ms = color.fgFaint(`${d.ms}ms`.padEnd(8));
    const status = color.green(String(d.status));
    const time = color.fgFaint(formatTime(d.t * 1000));

    if (d.templated && d.renderedTitle) {
        const msg = color.fg(d.renderedTitle);
        const body = d.renderedBody ? color.fgMuted(` · ${d.renderedBody}`) : '';

        console.log(`${time}  ${dot}  ${ch}  ${status}  ${ms}  ${msg}${body}`);
    } else {
        console.log(
            `${time}  ${dot}  ${ch}  ${status}  ${ms}  ${color.fgMuted('raw →')} ${inlineJson(d.payload)}`,
        );
    }
}

async function webhookRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });

    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
