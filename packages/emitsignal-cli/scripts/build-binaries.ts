#!/usr/bin/env bun
/**
 * Cross-compiles the CLI into standalone binaries (one per OS/arch) using
 * `bun build --compile`, then archives each as a `.tar.gz` and writes a
 * combined `checksums.txt`. Each binary embeds the Bun runtime, so the target
 * machine needs nothing installed.
 *
 * The archives are what the Homebrew formula and the shell installer
 * (`scripts/install.sh`) download, named `emitsignal-<os>-<arch>.tar.gz` with
 * `arch` ∈ {x64, arm64} to match `uname -m` normalization in the installer.
 *
 * Usage:
 *   bun run scripts/build-binaries.ts            # build all targets
 *   bun run scripts/build-binaries.ts --host     # build only the host target
 */
import { $ } from 'bun';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface BuildTarget {
    /** Artifact architecture, e.g. `x64` or `arm64`. */
    architecture: string;
    /** Artifact operating system, e.g. `darwin` or `linux`. */
    operatingSystem: string;
}

const TARGETS: BuildTarget[] = [
    { architecture: 'arm64', operatingSystem: 'darwin' },
    { architecture: 'x64', operatingSystem: 'darwin' },
    { architecture: 'x64', operatingSystem: 'linux' },
    { architecture: 'arm64', operatingSystem: 'linux' },
];

const OUTPUT_DIRECTORY = join(import.meta.dir, '..', 'dist-bin');
const ENTRY_POINT = join(import.meta.dir, '..', 'src', 'index.ts');

async function buildTarget(target: BuildTarget): Promise<void> {
    const platform = platformOf(target);
    const archivePath = join(OUTPUT_DIRECTORY, `emitsignal-${platform}.tar.gz`);

    // Stage each binary under the stable inner name `emitsignal` so the
    // installer and Homebrew formula always extract the same path. A per-target
    // staging dir keeps `tar` portable across GNU tar and macOS bsdtar (no
    // `--transform`/`-s`).
    const stagingDirectory = join(OUTPUT_DIRECTORY, `stage-${platform}`);
    const binaryPath = join(stagingDirectory, 'emitsignal');

    console.log(`building ${platform}…`);
    await mkdir(stagingDirectory, { recursive: true });

    await $`bun build --compile --minify --target=${`bun-${platform}`} ${ENTRY_POINT} --outfile ${binaryPath}`.quiet();
    await $`tar -czf ${archivePath} -C ${stagingDirectory} emitsignal`.quiet();
    await rm(stagingDirectory, { force: true, recursive: true });
}

function isHostTarget(target: BuildTarget): boolean {
    const hostArch = process.arch === 'arm64' ? 'arm64' : 'x64';
    const hostOs = process.platform === 'darwin' ? 'darwin' : 'linux';

    return target.operatingSystem === hostOs && target.architecture === hostArch;
}

async function main(): Promise<void> {
    const hostOnly = process.argv.includes('--host');
    const selected = hostOnly ? TARGETS.filter(isHostTarget) : TARGETS;

    await rm(OUTPUT_DIRECTORY, { force: true, recursive: true });
    await mkdir(OUTPUT_DIRECTORY, { recursive: true });

    for (const target of selected) {
        await buildTarget(target);
    }

    await writeChecksums();

    console.log(`\nartifacts written to ${OUTPUT_DIRECTORY}`);
    await $`ls -lh ${OUTPUT_DIRECTORY}`;
}

function platformOf(target: BuildTarget): string {
    return `${target.operatingSystem}-${target.architecture}`;
}

async function writeChecksums(): Promise<void> {
    const files = (await readdir(OUTPUT_DIRECTORY))
        .filter((file) => file.endsWith('.tar.gz'))
        .sort();
    const lines: string[] = [];

    for (const file of files) {
        const contents = await readFile(join(OUTPUT_DIRECTORY, file));

        lines.push(`${createHash('sha256').update(contents).digest('hex')}  ${file}`);
    }

    await writeFile(join(OUTPUT_DIRECTORY, 'checksums.txt'), `${lines.join('\n')}\n`);
}

await main();
