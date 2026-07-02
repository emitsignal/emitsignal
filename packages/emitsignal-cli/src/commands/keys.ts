import type { Command } from 'commander';

import { relativeTime } from '@emitsignal/shared';

import { getBaseUrl, getToken } from '../config.ts';
import { color, err, ok } from '../output.ts';

interface ApiKey {
    createdAt: string;
    enabled: boolean;
    expiresAt: null | string;
    id: string;
    lastRequest: null | string;
    name: null | string;
    start: null | string;
}

export function registerKeysCommand(program: Command): void {
    const keys = program.command('keys').description('Manage scoped API keys');

    keys.command('list')
        .description('List all API keys')
        .option('--json', 'Machine-readable output')
        .action(async (opts) => {
            try {
                const { apiKeys } = await keysRequest<{ apiKeys: ApiKey[] }>('/api-key/list');

                if (opts.json) {
                    return console.log(JSON.stringify(apiKeys, null, 2));
                }

                for (const key of apiKeys) {
                    const status = key.enabled ? color.green('active') : color.fgFaint('revoked');
                    const masked = `${(key.start ?? '').slice(0, 11)}••••`;
                    const lastUsed = key.lastRequest ? relativeTime(key.lastRequest) : 'never';

                    console.log(
                        `${color.fg((key.name ?? 'untitled').padEnd(16))}  ${color.fgDim(masked.padEnd(22))}  ${color.fgMuted(lastUsed.padEnd(10))}  ${status}`,
                    );
                }
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    keys.command('create')
        .description('Create a new API key')
        .option('--json', 'Machine-readable output')
        .option('-e, --expires <dur>', 'Auto-revoke after duration (90d, 1y)')
        .option('-n, --name <label>', 'Human label for the key')
        .action(async (opts) => {
            try {
                const body: Record<string, number | string> = {};

                if (opts.name) {
                    body['name'] = opts.name as string;
                }

                if (opts.expires) {
                    const expiresIn = expiresToSeconds(opts.expires as string);

                    if (expiresIn === null) {
                        throw new Error(
                            `invalid --expires value "${opts.expires as string}" — use e.g. 90d, 1y`,
                        );
                    }

                    body['expiresIn'] = expiresIn;
                }

                const key = await keysRequest<{ key: string } & ApiKey>('/api-key/create', {
                    body: JSON.stringify(body),
                    method: 'POST',
                });

                if (opts.json) {
                    return console.log(JSON.stringify(key, null, 2));
                }

                console.log(`  name     ${color.fg(key.name ?? 'untitled')}`);

                if (opts.expires) {
                    console.log(`  expires  ${color.fgMuted(`in ${opts.expires as string}`)}`);
                }

                console.log(`  secret   ${color.amber(key.key)}`);

                ok('store this now — it will not be shown again');
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    keys.command('revoke <id>')
        .description('Revoke an API key by ID')
        .action(async (id: string) => {
            try {
                await keysRequest<void>('/api-key/delete', {
                    body: JSON.stringify({ keyId: id }),
                    method: 'POST',
                });

                ok(`revoked key ${color.fgDim(id)}`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });
}

function expiresToSeconds(value: string): null | number {
    const match = /^(\d+)(d|y)$/.exec(value);

    if (!match) {
        return null;
    }

    const amount = parseInt(match[1]!, 10);

    return match[2] === 'y' ? amount * 365 * 86_400 : amount * 86_400;
}

async function keysRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getBaseUrl()}/api/auth${path}`, { ...init, headers });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);

        throw new Error(`${res.status} ${text}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
