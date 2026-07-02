import type { Command } from 'commander';

import * as readline from 'node:readline';

import { getBaseUrl, getToken, readConfig, writeConfig } from '../config.ts';
import { arrow, color, err, ok } from '../output.ts';

interface AuthUser {
    email: string;
    id: string;
    name: string;
}

export function registerAuthCommands(program: Command): void {
    program
        .command('login')
        .description('Authenticate via email sign-in code and save token to ~/.emitsignalrc')
        .action(async () => {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

            try {
                const email = (await prompt(rl, `${color.fgDim('email')} › `)).trim();
                await requestSignInCode(email);

                arrow(`check ${color.fg(email)} for your sign-in code`);

                const code = (await prompt(rl, `${color.fgDim('code')} › `)).trim();
                const { token, user } = await verifySignInCode(email, code);

                const config = readConfig();

                config.auth = { token, user: user.email };

                writeConfig(config);

                ok(`authorized as ${color.fg(user.email)} · token written to ~/.emitsignalrc`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));
                process.exit(3);
            } finally {
                rl.close();
            }
        });

    program
        .command('whoami')
        .description('Show the currently authenticated user')
        .action(async () => {
            try {
                const token = getToken();
                const user = token ? await getCurrentUser(token) : null;

                if (!user) {
                    err('not authenticated — run `emitsignal login`');

                    process.exit(3);
                }

                console.log(`${user.name} <${color.fg(user.email)}>`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(3);
            }
        });
}

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${getBaseUrl()}/api/auth${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);

        throw new Error(`${response.status} ${text}`);
    }

    return (await response.json()) as T;
}

async function getCurrentUser(token: string): Promise<AuthUser | null> {
    const session = await authRequest<{ user: AuthUser } | null>('/get-session', {
        headers: { Authorization: `Bearer ${token}` },
    });

    return session?.user ?? null;
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function requestSignInCode(email: string): Promise<void> {
    await authRequest('/email-otp/send-verification-otp', {
        body: JSON.stringify({ email, type: 'sign-in' }),
        method: 'POST',
    });
}

async function verifySignInCode(
    email: string,
    otp: string,
): Promise<{ token: string; user: AuthUser }> {
    return authRequest('/sign-in/email-otp', {
        body: JSON.stringify({ email, otp }),
        method: 'POST',
    });
}
