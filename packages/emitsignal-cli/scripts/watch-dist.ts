#!/usr/bin/env bun
/**
 * Development watcher: rebuilds `dist/` whenever a source file under `src/`
 * changes. Unlike the `build` script, this produces an unminified bundle for
 * readable stack traces and skips the production tuning, trading output size
 * for a fast edit → rebuild loop.
 *
 * Run alongside a linked global install (`bun link`) so the `emitsignal`/`es`
 * binaries pick up each rebuild.
 *
 * Usage:
 *   bun run scripts/watch-dist.ts
 */
import { watch } from 'node:fs';
import { join } from 'node:path';

const SOURCE_DIRECTORY = join(import.meta.dir, '..', 'src');
const ENTRY_POINT = join(SOURCE_DIRECTORY, 'index.ts');
const OUTPUT_DIRECTORY = join(import.meta.dir, '..', 'dist');

/** Delay in milliseconds used to coalesce bursts of file-change events. */
const DEBOUNCE_MILLISECONDS = 100;

let rebuildTimer: ReturnType<typeof setTimeout> | undefined;
let isBuilding = false;
let rebuildQueued = false;

async function build(): Promise<void> {
    if (isBuilding) {
        rebuildQueued = true;

        return;
    }

    isBuilding = true;

    const startedAt = performance.now();
    const result = await Bun.build({
        entrypoints: [ENTRY_POINT],
        format: 'esm',
        outdir: OUTPUT_DIRECTORY,
        target: 'node',
    });

    if (result.success) {
        const durationMilliseconds = Math.round(performance.now() - startedAt);

        console.log(`✓ rebuilt dist in ${durationMilliseconds}ms`);
    } else {
        console.error('✗ build failed');

        for (const log of result.logs) {
            console.error(log);
        }
    }

    isBuilding = false;

    if (rebuildQueued) {
        rebuildQueued = false;

        await build();
    }
}

function scheduleBuild(): void {
    if (rebuildTimer) {
        clearTimeout(rebuildTimer);
    }

    rebuildTimer = setTimeout(() => {
        void build();
    }, DEBOUNCE_MILLISECONDS);
}

console.log(`watching ${SOURCE_DIRECTORY} for changes…`);
await build();

watch(SOURCE_DIRECTORY, { recursive: true }, () => {
    scheduleBuild();
});
