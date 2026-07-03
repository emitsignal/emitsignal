#!/usr/bin/env node
import { Command } from 'commander';

import pkg from '../package.json';
import { registerAuthCommands } from './commands/auth.ts';
import { registerConfigCommand } from './commands/config-cmd.ts';
import { registerKeysCommand } from './commands/keys.ts';
import { registerListenCommand } from './commands/listen.ts';
import { registerPublishCommand } from './commands/publish.ts';
import { registerSubscribeCommands } from './commands/subscribe.ts';
import { registerTuiCommand } from './commands/tui.ts';
import { registerWebhooksCommand } from './commands/webhooks.ts';

const program = new Command()
    .name('emitsignal')
    .description('Publish and stream signals from your terminal')
    .version(pkg.version, '-v, --version')
    .addHelpText(
        'after',
        `
  Short alias: es

  Examples:
    emitsignal publish deploy/prod -p4 -m "shipped v2.14.3"
    emitsignal listen --priority >=2 --format pretty
    emitsignal subscribe alerts/prod
    emitsignal tui
`,
    );

registerAuthCommands(program);
registerConfigCommand(program);
registerKeysCommand(program);
registerListenCommand(program);
registerPublishCommand(program);
registerSubscribeCommands(program);
registerTuiCommand(program);
registerWebhooksCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));

    process.exit(1);
});
