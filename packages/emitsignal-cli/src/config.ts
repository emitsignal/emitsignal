import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** Sections that identify the user rather than configure the CLI. */
export const IDENTITY_SECTIONS: readonly string[] = ['auth', 'device'];

export function deleteConfig(): void {
    rmSync(configPath, { force: true });
}

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

/**
 * Drop every stored setting so the built-in defaults apply again, keeping the
 * sections that identify the user rather than configure the CLI: `auth` would
 * log them out, and a regenerated `device.id` would orphan their push
 * subscriptions. Use `deleteConfig` to clear those too.
 */
export function resetConfig(): void {
    const { auth, device } = readConfig();
    const preserved: CliConfig = {};

    if (auth) {
        preserved.auth = auth;
    }

    if (device) {
        preserved.device = device;
    }

    writeConfig(preserved);
}

export function writeConfig(config: CliConfig): void {
    writeFileSync(configPath, stringify(config as unknown as Record<string, unknown>), {
        encoding: 'utf-8',
        mode: 0o600,
    });

    chmodSync(configPath, 0o600);
}
