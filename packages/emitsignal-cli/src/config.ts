import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'smol-toml';

export interface CliConfig {
    alias?: Record<string, string>;
    auth?: { token?: string; user?: string };
    console?: { url?: string };
    default?: { color?: string; format?: string; priority?: number };
    device?: { id?: string };
    server?: { url?: string };
}

export const configPath = join(homedir(), '.emitsignalrc');

export function getBaseUrl(): string {
    return process.env['ES_BASE_URL'] ?? readConfig().server?.url ?? 'https://api.emitsignal.com';
}

export function getConsoleUrl(): string {
    return process.env['ES_CONSOLE_URL'] ?? readConfig().console?.url ?? 'https://emitsignal.com';
}

export function getDeviceId(): string {
    const config = readConfig();

    if (config.device?.id) {
        return config.device.id;
    }

    const id = randomUUID();

    config.device = { id };

    writeConfig(config);

    return id;
}

export function getToken(): string | undefined {
    return process.env['ES_TOKEN'] ?? readConfig().auth?.token;
}

export function readConfig(): CliConfig {
    if (!existsSync(configPath)) {
        return {};
    }

    try {
        return parse(readFileSync(configPath, 'utf-8')) as CliConfig;
    } catch {
        return {};
    }
}

export function writeConfig(config: CliConfig): void {
    writeFileSync(configPath, stringify(config as unknown as Record<string, unknown>), 'utf-8');
}
