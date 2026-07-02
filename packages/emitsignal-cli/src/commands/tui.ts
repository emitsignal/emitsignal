import type { Command } from 'commander';

import { createClient } from '../client.ts';
import { getBaseUrl, getConsoleUrl, getDeviceId, getToken } from '../config.ts';
import { err } from '../output.ts';

export function registerTuiCommand(program: Command): void {
    program
        .command('tui')
        .description('Open the full-screen terminal inbox (keyboard-driven)')
        .option('-c, --channel <glob>', 'Focus a specific channel on launch')
        .option('-f, --filter <expr>', 'Pre-apply a filter expression (same grammar as listen)')
        .action(async (opts) => {
            const token = getToken();

            if (!token) {
                err('not logged in — run `emitsignal login` first');

                process.exit(3);
            }

            let subscriptions: { topic: { name: string } }[] = [];

            try {
                subscriptions = await createClient().api.listSubscriptions(getDeviceId());
            } catch {
                // proceed with empty list; SSE will still connect
            }

            const { launchTui } = await import('../tui/App.tsx');

            await launchTui({
                baseUrl: getBaseUrl(),
                consoleUrl: getConsoleUrl(),
                filter: opts.filter as string | undefined,
                focusChannel: opts.channel as string | undefined,
                subscriptions,
                token,
            });

            // Clean exit after renderer has fully restored the terminal.
            // Without this, dangling SSE event listeners keep the process alive.
            process.exit(0);
        });
}
