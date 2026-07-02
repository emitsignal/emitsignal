import type { Command } from 'commander';

import { createClient } from '../client.ts';
import { color, err, ok } from '../output.ts';

export function registerPublishCommand(program: Command): void {
    program
        .command('publish')
        .alias('pub')
        .description('Send a signal to a topic')
        .argument('<topic>', 'Topic to publish to')
        .argument('[body]', 'Signal body (reads stdin if omitted)')
        .option('--from-stdin', 'Force read body from stdin')
        .option('-m, --message <text>', 'Body text (alias for positional body)')
        .option('-p, --priority <1-5>', 'Severity 1=low 5=critical', '3')
        .option('-T, --title <text>', 'Headline (defaults to first line of body)')
        .option(
            '-t, --tag <tags>',
            'Comma-separated tags, repeatable',
            (v: string, prev: string[]) => [...prev, ...v.split(',').map((s) => s.trim())],
            [] as string[],
        )
        .option('-l, --link <url>', 'Tap-through URL attached to the push')
        .option('-q, --quiet', 'Suppress confirmation output')
        .action(async (topic: string, bodyArg: string | undefined, opts) => {
            try {
                let body: string = opts.message ?? bodyArg ?? '';

                if (opts.fromStdin || (!body && !process.stdin.isTTY)) {
                    const chunks: string[] = [];

                    for await (const chunk of process.stdin) chunks.push(String(chunk));

                    body = chunks.join('').trim();
                }

                const priority = parseInt(opts.priority as string, 10);
                const tags: string[] = opts.tag as string[];
                const title: string = opts.title ?? body.split('\n')[0]?.slice(0, 120) ?? '';

                const t0 = Date.now();

                await createClient().api.publish(topic, { body, priority, tags, title });

                const ms = Date.now() - t0;

                if (!opts.quiet) {
                    ok(`published → ${color.violet(topic)} · ${ms}ms`);
                }
            } catch (error) {
                err(error instanceof Error ? error.message : String(error));

                process.exit(1);
            }
        });
}
