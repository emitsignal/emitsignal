import type { Command } from 'commander';

import { configPath, getBaseUrl, getConsoleUrl, readConfig, writeConfig } from '../config.ts';
import { color, err, ok } from '../output.ts';

export function registerConfigCommand(program: Command): void {
    const cfg = program
        .command('config')
        .description('Read and write CLI defaults (~/.emitsignalrc)');

    cfg.command('get <key>')
        .description('Get a config value (e.g. default.format)')
        .action((key: string) => {
            const value = getNestedValue(readConfig(), key);

            if (value === undefined) {
                err(`key not found: ${key}`);
                process.exit(2);
            }
            console.log(String(value));
        });

    cfg.command('set <key> <value>')
        .description('Set a config value')
        .action((key: string, value: string) => {
            const config = readConfig();
            const parsed = coerce(value);

            setNestedValue(config as unknown as Record<string, unknown>, key, parsed);
            writeConfig(config);
            ok(`${key} = ${color.violet(String(parsed))}`);
        });

    cfg.command('list')
        .description('Print all config values')
        .action(() => {
            const config = readConfig();

            for (const [section, vals] of Object.entries(config)) {
                console.log(color.fgDim(`[${section}]`));

                if (typeof vals === 'object' && vals !== null) {
                    for (const [k, v] of Object.entries(vals)) {
                        console.log(`${k.padEnd(14)} = ${color.fg(String(v))}`);
                    }
                }
                console.log();
            }
        });

    cfg.command('path')
        .description('Print the path to the config file')
        .action(() => {
            console.log(configPath);
        });

    cfg.command('get-url')
        .description('Print the active API server URL')
        .action(() => {
            console.log(getBaseUrl());
        });

    cfg.command('set-url <url>')
        .description('Point the CLI at a different API server (e.g. a self-hosted instance)')
        .action((url: string) => {
            const config = readConfig();
            config.server = { url };
            writeConfig(config);
            ok(`server.url = ${color.violet(url)}`);
        });

    cfg.command('get-console-url')
        .description('Print the active web console URL')
        .action(() => {
            console.log(getConsoleUrl());
        });

    cfg.command('set-console-url <url>')
        .description('Point "open in console" links at a different web console (e.g. self-hosted)')
        .action((url: string) => {
            const config = readConfig();
            config.console = { url };
            writeConfig(config);
            ok(`console.url = ${color.violet(url)}`);
        });
}

function coerce(value: string): unknown {
    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    const number = Number(value);

    return isNaN(number) ? value : number;
}

function getNestedValue(obj: unknown, keyPath: string): unknown {
    return keyPath
        .split('.')
        .reduce((cur, k) => (cur as Record<string, unknown> | undefined)?.[k], obj as unknown);
}

function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: unknown): void {
    const parts = keyPath.split('.');

    let currentValue = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i]!;

        if (!currentValue[k] || typeof currentValue[k] !== 'object') {
            currentValue[k] = {};
        }

        currentValue = currentValue[k] as Record<string, unknown>;
    }

    currentValue[parts[parts.length - 1]!] = value;
}
