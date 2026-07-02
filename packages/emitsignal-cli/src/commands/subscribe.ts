import type { Command } from 'commander';

import { createClient } from '../client.ts';
import { getDeviceId } from '../config.ts';
import { color, err, ok } from '../output.ts';

export function registerSubscribeCommands(program: Command): void {
    program
        .command('subscribe')
        .alias('sub')
        .description('Subscribe to a topic (use --list to list all)')
        .argument('[topic]', 'Topic to subscribe to')
        .option('--targets <list>', 'Override delivery targets: push,email,sms,slack')
        .option('-l, --list', 'Print all current subscriptions and exit')
        .option('-m, --mute <dur>', 'Subscribe but silence delivery for a duration (8h, 1d)')
        .option('-p, --min-priority <1-5>', 'Minimum priority to receive', '1')
        .action(async (topic: string | undefined, opts) => {
            const client = createClient();

            if (opts.list || !topic) {
                try {
                    const subscriptions = await client.api.listSubscriptions(getDeviceId());

                    if (subscriptions.length === 0) {
                        return console.log(color.fgDim('no subscriptions'));
                    }

                    for (const subscription of subscriptions) {
                        const push = subscription.pushEnabled
                            ? color.green('push')
                            : color.fgFaint('muted');

                        console.log(
                            `${color.fg(subscription.topic.name.padEnd(22))} ${color.fgDim('p≥1')}   ${push}`,
                        );
                    }
                } catch (error) {
                    err(error instanceof Error ? error.message : String(error));

                    process.exit(1);
                }
                return;
            }

            try {
                await client.api.subscribe(getDeviceId(), topic, true);

                ok(`subscribed → ${color.violet(topic)} · p≥${opts.minPriority ?? 1} · push`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });

    program
        .command('unsubscribe')
        .alias('unsub')
        .description('Unsubscribe from a topic')
        .argument('<topic>', 'Topic to unsubscribe from')
        .action(async (topic: string) => {
            try {
                const client = await createClient();

                client.api.unsubscribe(getDeviceId(), topic);

                ok(`removed → ${color.violet(topic)}`);
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });
}
