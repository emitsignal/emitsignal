import type { VerificationScheme } from '@emitsignal/shared';
import type { Command } from 'commander';

import { defaultVerificationForSource, relativeTime } from '@emitsignal/shared';
import { readFileSync } from 'node:fs';

import { getBaseUrl, getToken } from '../config.ts';
import { arrow, color, emptyState, err, formatTime, highlightJson, ok } from '../output.ts';
import { streamSse } from '../sse.ts';

interface ApiError {
    error?: string;
    limit?: number;
    message?: string;
    metric?: string;
    plan?: string;
}

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
    count24h: number;
    hasSecret?: boolean;
    id: string;
    lastDeliveryAt?: null | number;
    name: string;
    slug: string;
    source: string;
    status: 'active' | 'error' | 'paused';
    templated: boolean;
    topicName: string;
    verification?: VerificationScheme;
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
        .option(
            '--verification <scheme>',
            'Verify inbound signatures (none|github|stripe|svix|hmac|token)',
        )
        .option('--secret <value>', 'Signing secret from the sending provider')
        .option('--verification-config <json>', 'Header config, required for hmac and token')
        .action(async (opts) => {
            try {
                if (!opts.channel) {
                    err('pass -c, --channel <topic> — deliveries must publish to a topic');

                    process.exit(1);
                }

                const source = (opts.source as string) ?? 'custom';

                const body: Record<string, string> = {
                    source,
                    topicName: opts.channel as string,
                };

                if (opts.name) {
                    body['name'] = opts.name as string;
                }

                if (opts.template) {
                    body['template'] = readTemplateFile(opts.template as string);
                }

                if (opts.secret) {
                    body['secret'] = opts.secret as string;
                    // A secret with no scheme verifies the way the source normally signs.
                    body['verification'] =
                        (opts.verification as string) ?? defaultVerificationForSource(source);
                } else if (opts.verification) {
                    body['verification'] = opts.verification as string;
                }

                if (opts.verificationConfig) {
                    body['verificationConfig'] = opts.verificationConfig as string;
                }

                const webhook = await webhookRequest<{ endpointUrl: string } & Webhook>(
                    '/webhooks',
                    {
                        body: JSON.stringify(body),
                        method: 'POST',
                    },
                );

                if (opts.json) {
                    return console.log(highlightJson(webhook));
                }

                console.log(`  id        ${color.fgMuted(webhook.id)}`);
                console.log(`  name      ${color.fg(webhook.name)}`);
                console.log(`  source    ${color.fgMuted(webhook.source)}`);
                console.log(`  channel   ${color.fgMuted(webhook.topicName)}`);
                console.log(
                    `  endpoint  ${color.amber(webhook.endpointUrl ?? `/h/${webhook.slug}`)}`,
                );
                console.log(
                    `  template  ${webhook.templated ? color.violet('yes') : color.fgDim('no (raw passthrough)')}`,
                );
                console.log(
                    `  verify    ${
                        webhook.verification && webhook.verification !== 'none'
                            ? color.green(webhook.verification)
                            : color.amber('none — anyone with the URL can post')
                    }`,
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
                    return console.log(highlightJson(webhooks));
                }

                if (!webhooks.length) {
                    return emptyState(
                        'no webhook endpoints yet',
                        'create one with: es webhooks create -c <topic>',
                    );
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
                        ? relativeTime(webhook.lastDeliveryAt * 1000)
                        : 'never';

                    console.log(
                        `${color.fgFaint(webhook.id.padEnd(26))}  ${color.fg((webhook.name ?? '').padEnd(20))}  ${color.fgMuted(`/h/${webhook.slug}`.padEnd(14))}  ${color.fgDim((webhook.topicName ?? '').padEnd(18))}  ${tpl}  ${color.fgFaint(last.padEnd(8))}  ${status}`,
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

                const baseUrl = getBaseUrl();
                const url = source
                    ? `${baseUrl}/webhooks/stream?source=${encodeURIComponent(source)}`
                    : `${baseUrl}/webhooks/stream`;

                await streamSse<Delivery>(url, {
                    onEvent: (delivery) => printDelivery(delivery, opts.json as boolean),
                    signal: controller.signal,
                    token: getToken(),
                });
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
                        console.log(highlightJson(delivery));
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

                const url = `${getBaseUrl()}/webhooks/stream?source=${encodeURIComponent(source)}`;

                await streamSse<Delivery>(url, {
                    onEvent: (delivery) => printDelivery(delivery, false),
                    signal: controller.signal,
                    token: getToken(),
                });
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
                    await webhookRequest<Webhook>(`/webhooks/${id}`, {
                        body: JSON.stringify({ template: null }),
                        method: 'PATCH',
                    });

                    return ok(`template cleared — ${color.fgDim(id)} now forwards raw payloads`);
                }

                if (!opts.file) {
                    err('pass --file <path> or --clear');

                    process.exit(1);
                }

                const template = readTemplateFile(opts.file as string);

                await webhookRequest<Webhook>(`/webhooks/${id}`, {
                    body: JSON.stringify({ template }),
                    method: 'PATCH',
                });

                ok(`template saved — new deliveries to ${color.fgDim(id)} will render with it`);
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

async function describeError(res: Response): Promise<string> {
    const fallback = `${res.status} ${res.statusText}`;

    let payload: ApiError;

    try {
        payload = (await res.json()) as ApiError;
    } catch {
        return fallback;
    }

    if (!payload || typeof payload !== 'object') {
        return fallback;
    }

    if (payload.error === 'plan_limit_reached') {
        const metric = payload.metric ?? 'resources';
        const plan = payload.plan ?? 'current';
        const limit = payload.limit;
        const cap = typeof limit === 'number' ? ` (limit: ${limit})` : '';

        return `plan limit reached — the ${plan} plan allows no more ${metric}${cap}. Upgrade your plan or delete an existing one.`;
    }

    const detail = payload.message ?? payload.error;

    return detail ? `${fallback} — ${detail}` : fallback;
}

function inlineJson(obj: Record<string, unknown>): string {
    return color.fgDim(JSON.stringify(obj).slice(0, 120));
}

function printDelivery(delivery: Delivery, asJson: boolean): void {
    if (asJson) {
        console.log(highlightJson(delivery));

        return;
    }

    const ch = color.fgDim((delivery.channel ?? '').padEnd(18));
    const dot = delivery.templated ? color.violet('●') : color.fgDim('○');
    const ms = color.fgFaint(`${delivery.ms}ms`.padEnd(8));
    const status = color.green(String(delivery.status));
    const time = color.fgFaint(formatTime(delivery.t * 1000));

    if (delivery.templated && delivery.renderedTitle) {
        const message = color.fg(delivery.renderedTitle);
        const body = delivery.renderedBody ? color.fgMuted(` · ${delivery.renderedBody}`) : '';

        console.log(`${time}  ${dot}  ${ch}  ${status}  ${ms}  ${message}${body}`);
    } else {
        console.log(
            `${time}  ${dot}  ${ch}  ${status}  ${ms}  ${color.fgMuted('raw →')} ${inlineJson(delivery.payload)}`,
        );
    }
}

function readTemplateFile(path: string): string {
    const template = readFileSync(path, 'utf-8');

    try {
        JSON.parse(template);
    } catch {
        throw new Error(
            `template file ${path} must be valid JSON — see the webhooks template format`,
        );
    }

    return template;
}

async function webhookRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });

    if (!res.ok) {
        throw new Error(await describeError(res));
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
