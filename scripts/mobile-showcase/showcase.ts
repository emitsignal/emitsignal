#!/usr/bin/env bun
// Store screenshot harness. Boots each configured simulator/emulator, puts the
// app into a known anonymous state, walks the scenes by deep link, and writes
// upload-ready PNGs validated against the App Store / Play specs.
//
// There is no UI automation here. Navigation is deep links, the anonymous device
// id and the onboarding flag are read and written straight out of the app's
// AsyncStorage, and subscriptions go through the public API.
//
// Derived from the mobile screenshot harness in pingdotgg/t3code (MIT).
// See LICENSE.upstream in this directory.

import * as NodeChildProcess from 'node:child_process';
import * as NodeFSP from 'node:fs/promises';
import * as NodeNet from 'node:net';
import * as NodeOS from 'node:os';
import * as NodePath from 'node:path';
import * as NodeProcess from 'node:process';
import * as NodeURL from 'node:url';
import { PNG } from 'pngjs';

import {
    type AppStorage,
    DEVICE_ID_KEY,
    ONBOARDING_KEY,
    patchAndroidStorage,
    patchIosStorage,
    readAndroidStorage,
    readIosStorage,
} from './showcase-app-state.ts';
import {
    findShowcaseMessage,
    publishShowcaseContent,
    SHOWCASE_MEDIA_PORT,
    startShowcaseMediaServer,
    subscribeDevice,
} from './showcase-content.ts';
import showcaseConfig, {
    PRE_ONBOARDING_SCENES,
    SHOWCASE_MESSAGE_TITLE,
    SHOWCASE_SCENES,
    SHOWCASE_TOPICS,
    type ShowcaseAndroidDevice,
    type ShowcaseConfig,
    type ShowcaseDevice,
    type ShowcaseIosDevice,
    type ShowcaseScene,
    type ShowcaseStoreAssetSpec,
} from './showcase.config.ts';

interface CliOptions {
    readonly deviceIds: ReadonlySet<string>;
    readonly list: boolean;
    readonly scenes: ReadonlySet<ShowcaseScene>;
    readonly skipMetro: boolean;
}

interface PngMetadata {
    readonly bitDepth: number;
    readonly colorType: number;
    readonly hasAlpha: boolean;
    readonly height: number;
    readonly width: number;
}

interface ShowcaseApp {
    readonly appId: string;
    readonly scheme: string;
}

interface SimctlDevice {
    readonly isAvailable: boolean;
    readonly name: string;
    readonly state: string;
    readonly udid: string;
}

const SCRIPT_DIRECTORY = NodePath.dirname(NodeURL.fileURLToPath(import.meta.url));
const REPO_ROOT = NodePath.resolve(SCRIPT_DIRECTORY, '../..');
const MOBILE_ROOT = NodePath.join(REPO_ROOT, 'packages/emitsignal-mobile');

const API_URL = (process.env.EMITSIGNAL_API_URL ?? 'http://127.0.0.1:5001').replace(/\/+$/, '');

// Mirrors getProjectConfig() in packages/emitsignal-mobile/app.config.ts. The
// harness captures whichever variant is installed on the device.
const APP_VARIANTS = {
    development: { appId: 'com.emitsignal.development', scheme: 'emitsignal-development' },
    preview: { appId: 'com.emitsignal.preview', scheme: 'emitsignal-preview' },
    production: { appId: 'com.emitsignal', scheme: 'emitsignal' },
} as const;

const APP_MODE = (process.env.APP_MODE ?? 'production') as keyof typeof APP_VARIANTS;

function androidSdkRoot(): string {
    const configured = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
    if (configured) return configured;
    return NodePath.join(NodeOS.homedir(), 'Library/Android/sdk');
}

/** The API port, so Android can be given a reverse tunnel for it. */
function apiPort(): number {
    const port = Number(new URL(API_URL).port);
    if (!port) {
        throw new Error(
            `EMITSIGNAL_API_URL must include an explicit port for the Android reverse tunnel (got ${API_URL}).`,
        );
    }
    return port;
}

function appFor(device: ShowcaseDevice): ShowcaseApp {
    return APP_VARIANTS[device.appMode ?? APP_MODE];
}

const ADB = NodePath.join(androidSdkRoot(), 'platform-tools/adb');
const EMULATOR = NodePath.join(androidSdkRoot(), 'emulator/emulator');

export function normalizeStorePng(bytes: Uint8Array): Buffer {
    const png = PNG.sync.read(Buffer.from(bytes));
    // Both stores reject alpha; simctl and screencap both emit RGBA.
    return PNG.sync.write(png, {
        bitDepth: 8,
        colorType: 2,
        inputColorType: 6,
        inputHasAlpha: true,
    });
}

export function parseShowcaseCliArgs(args: ReadonlyArray<string>): CliOptions {
    const deviceIds = new Set<string>();
    const scenes = new Set<ShowcaseScene>();
    let list = false;
    let skipMetro = false;

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (argument === '--device') {
            deviceIds.add(argumentValue(args, index, argument));
            index += 1;
        } else if (argument === '--scene') {
            const value = argumentValue(args, index, argument);
            if (!SHOWCASE_SCENES.includes(value as ShowcaseScene)) {
                throw new Error(`Unknown scene '${value}'. Use ${SHOWCASE_SCENES.join(', ')}.`);
            }
            scenes.add(value as ShowcaseScene);
            index += 1;
        } else if (argument === '--skip-metro') {
            skipMetro = true;
        } else if (argument === '--list' || argument === '--help' || argument === '-h') {
            list = true;
        } else {
            throw new Error(`Unknown option '${argument}'.`);
        }
    }

    return { deviceIds, list, scenes, skipMetro };
}

export function readPngMetadata(bytes: Uint8Array): PngMetadata {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.byteLength < 26 || !signature.every((value, index) => bytes[index] === value)) {
        throw new Error('Captured file is not a valid PNG.');
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const colorType = view.getUint8(25);
    return {
        bitDepth: view.getUint8(24),
        colorType,
        hasAlpha: colorType === 4 || colorType === 6,
        height: view.getUint32(20),
        width: view.getUint32(16),
    };
}

export function sceneUrl(app: ShowcaseApp, scene: ShowcaseScene, messageId: string): string {
    // Expo Router omits route groups from URLs, so app/(tabs)/channels.tsx is /channels.
    const paths: Record<ShowcaseScene, string> = {
        channels: '/channels',
        feed: '/',
        landing: '/auth',
        message: `/messages/${messageId}`,
        publish: '/publish',
        settings: '/settings',
        'sign-in': '/auth/sign-in',
    };
    return `${app.scheme}://${paths[scene]}`;
}

export function selectDevices(
    config: ShowcaseConfig,
    deviceIds: ReadonlySet<string>,
): ReadonlyArray<ShowcaseDevice> {
    const known = new Set(config.devices.map((device) => device.id));
    for (const id of deviceIds) {
        if (!known.has(id)) {
            throw new Error(`Unknown device '${id}'. Run with --list to see the matrix.`);
        }
    }
    return config.devices.filter((device) => deviceIds.size === 0 || deviceIds.has(device.id));
}

export function selectScenes(scenes: ReadonlySet<ShowcaseScene>): ReadonlyArray<ShowcaseScene> {
    return SHOWCASE_SCENES.filter((scene) => scenes.size === 0 || scenes.has(scene));
}

export function validateStoreAsset(
    spec: ShowcaseStoreAssetSpec,
    bytes: Uint8Array,
    label: string,
): PngMetadata {
    const metadata = readPngMetadata(bytes);
    if (metadata.width !== spec.width || metadata.height !== spec.height) {
        throw new Error(
            `${label} is ${metadata.width}×${metadata.height}; ${spec.store} requires ${spec.width}×${spec.height}.`,
        );
    }
    if (metadata.bitDepth !== 8 || metadata.colorType !== 2 || metadata.hasAlpha) {
        throw new Error(
            `${label} must be an 8-bit, 24-bit RGB PNG without alpha (found bit depth ${metadata.bitDepth}, colour type ${metadata.colorType}).`,
        );
    }
    if (spec.maximumFileSizeBytes && bytes.byteLength > spec.maximumFileSizeBytes) {
        throw new Error(
            `${label} is ${bytes.byteLength} bytes; ${spec.store} allows at most ${spec.maximumFileSizeBytes}.`,
        );
    }
    if (spec.store === 'google-play') {
        const shortest = Math.min(metadata.width, metadata.height);
        const longest = Math.max(metadata.width, metadata.height);
        if (shortest < 320 || longest > 3_840 || longest > shortest * 2) {
            throw new Error(
                `${label} breaks Google Play's 320–3,840 px bounds or its 2:1 maximum aspect ratio.`,
            );
        }
        if (metadata.width * 16 !== metadata.height * 9) {
            throw new Error(`${label} must use Google Play's portrait 9:16 aspect ratio.`);
        }
    }
    return metadata;
}

export function validateStoreAssetCount(spec: ShowcaseStoreAssetSpec, count: number): void {
    if (count > spec.maximumUploadCount) {
        throw new Error(
            `${spec.directory} holds ${count} screenshots; ${spec.store} allows at most ${spec.maximumUploadCount}.`,
        );
    }
}

async function adbOutput(serial: string, args: ReadonlyArray<string>): Promise<string> {
    return await commandOutput(ADB, ['-s', serial, ...args]);
}

function argumentValue(args: ReadonlyArray<string>, index: number, flag: string): string {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
    return value;
}

/**
 * A bundler left over from an earlier run answers on the port and serves a
 * stale bundle — including a stale EXPO_PUBLIC_API_URL — so the capture would
 * quietly show the wrong data rather than fail.
 */
async function assertPortFree(port: number): Promise<void> {
    const inUse = await new Promise<boolean>((resolve) => {
        const socket = NodeNet.createConnection({ host: '127.0.0.1', port });
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => resolve(false));
        socket.setTimeout(500, () => {
            socket.destroy();
            resolve(false);
        });
    });
    if (inUse) {
        throw new Error(
            `Port ${port} is already in use. Stop whatever is listening (a leftover Metro from an earlier run?) or pass --skip-metro to reuse it deliberately.`,
        );
    }
}

async function captureDevice(
    device: ShowcaseDevice,
    scenes: ReadonlyArray<ShowcaseScene>,
    config: ShowcaseConfig,
    outputDirectory: string,
    log: (line: string) => void,
): Promise<() => Promise<void>> {
    const app = appFor(device);
    const directory = NodePath.join(outputDirectory, device.storeAsset.directory);
    await NodeFSP.mkdir(directory, { recursive: true });

    let target: string;
    let cleanup: () => Promise<void>;

    if (device.platform === 'ios') {
        const simulator = await findIosSimulator((device as ShowcaseIosDevice).simulator);
        target = simulator.udid;
        process.stdout.write(`  booting ${simulator.name} (${target})\n`);
        await runCommand('xcrun', ['simctl', 'boot', target]).catch(() => undefined);
        await runCommand('xcrun', ['simctl', 'bootstatus', target, '-b']);
        await normalizeIosSimulator(target);
        await resetIosApp(app.appId, target);
        await suppressIosDevMenu(app.appId, target);
        cleanup = async () => {
            await runCommand('xcrun', ['simctl', 'status_bar', target, 'clear']).catch(
                () => undefined,
            );
        };
    } else {
        const androidDevice = device as ShowcaseAndroidDevice;
        const running = (await runningAndroidAvds()).get(androidDevice.avd);
        if (!running) {
            const available = (await commandOutput(EMULATOR, ['-list-avds']))
                .split('\n')
                .map((line) => line.trim());
            if (!available.includes(androidDevice.avd)) {
                throw new Error(
                    `Android AVD '${androidDevice.avd}' is not installed. Run '${EMULATOR} -list-avds'.`,
                );
            }
            const emulator = spawnProcess(
                EMULATOR,
                ['-avd', androidDevice.avd, '-no-snapshot-load', '-no-boot-anim'],
                { detached: true, stdio: 'ignore' },
            );
            emulator.unref();
        }
        target = running ?? (await waitForAndroidSerial(androidDevice.avd));
        process.stdout.write(`  using ${androidDevice.avd} (${target})\n`);
        await normalizeAndroidEmulator(androidDevice, target);
        await runAdb(target, ['shell', 'pm', 'clear', app.appId]);
        await suppressAndroidDevMenu(app.appId, target);
        // Metro, the showcase media and the API all live on the host's
        // loopback, which inside the emulator is the emulator itself.
        for (const port of [config.metroPort, SHOWCASE_MEDIA_PORT, apiPort()]) {
            await runAdb(target, ['reverse', `tcp:${port}`, `tcp:${port}`]);
        }
        cleanup = async () => {
            await restoreAndroidEmulator(target);
        };
    }

    await launchApp(app, device, target, config, true);

    const preOnboarding = scenes.filter((scene) => PRE_ONBOARDING_SCENES.includes(scene));
    const postOnboarding = scenes.filter((scene) => !PRE_ONBOARDING_SCENES.includes(scene));

    for (const scene of preOnboarding) {
        await openScene(app, device, target, sceneUrl(app, scene, ''));
        await delay(config.settleDelayMs);
        await captureScene(device, target, scene, NodePath.join(directory, `${scene}.png`));
    }

    if (postOnboarding.length > 0) {
        const deviceId = await readDeviceId(app, device, target);
        log(`  subscribing device ${deviceId} to ${SHOWCASE_TOPICS.length} channels`);
        for (const topic of SHOWCASE_TOPICS) {
            await subscribeDevice(API_URL, deviceId, topic);
        }

        // Published only now, and once per device. The subscriptions above only
        // surface messages newer than themselves, which is what keeps the feed
        // to exactly this run's twelve even though the topics are long-lived and
        // shared with every previous run.
        log('  publishing the demo feed (paced for the anonymous 10/min limit)…');
        const published = await publishShowcaseContent(API_URL, log);
        const messageId = findShowcaseMessage(published, SHOWCASE_MESSAGE_TITLE).messageId;

        // Onboarding is one AsyncStorage flag; the landing page's skip button
        // sets the same one. Written while the app is stopped, because
        // AsyncStorage rewrites the whole store when the app next persists.
        await terminateApp(app, device, target);
        await patchAppStorage(app, device, target, { [ONBOARDING_KEY]: 'true' });
        await launchApp(app, device, target, config, false);

        for (const scene of postOnboarding) {
            await openScene(app, device, target, sceneUrl(app, scene, messageId));
            await delay(config.settleDelayMs);
            await captureScene(device, target, scene, NodePath.join(directory, `${scene}.png`));
        }
    }

    const written = (await NodeFSP.readdir(directory)).filter((file) => file.endsWith('.png'));
    validateStoreAssetCount(device.storeAsset, written.length);

    return cleanup;
}

async function captureScene(
    device: ShowcaseDevice,
    target: string,
    scene: ShowcaseScene,
    destination: string,
): Promise<void> {
    // Grab frames until two in a row match, so a screen still animating in — or
    // a list that has not painted its rows yet — is never what gets written.
    let previous: Buffer | null = null;
    let frame = await grabFrame(device, target);
    for (let attempt = 0; attempt < 8 && !previous?.equals(frame); attempt += 1) {
        previous = frame;
        await delay(1_200);
        frame = await grabFrame(device, target);
    }
    await NodeFSP.writeFile(destination, frame);

    const normalized = normalizeStorePng(await NodeFSP.readFile(destination));
    await NodeFSP.writeFile(destination, normalized);
    const metadata = validateStoreAsset(device.storeAsset, normalized, `${device.id}/${scene}.png`);
    process.stdout.write(
        `  ✓ ${scene.padEnd(9)} ${metadata.width}×${metadata.height} 24-bit RGB → ${NodePath.relative(REPO_ROOT, destination)}\n`,
    );
}

async function commandOutput(
    command: string,
    args: ReadonlyArray<string>,
    options: NodeChildProcess.ExecFileOptions = {},
): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        NodeChildProcess.execFile(
            command,
            [...args],
            { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options },
            (error, stdout) => (error ? reject(error) : resolve(String(stdout))),
        );
    });
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function findIosSimulator(name: string): Promise<SimctlDevice> {
    const parsed = JSON.parse(
        await commandOutput('xcrun', ['simctl', 'list', 'devices', 'available', '-j']),
    ) as { readonly devices: Readonly<Record<string, ReadonlyArray<SimctlDevice>>> };
    const match = Object.entries(parsed.devices)
        .filter(([runtime]) => runtime.includes('iOS'))
        .flatMap(([, devices]) => devices)
        .filter((device) => device.isAvailable && device.name === name)
        .at(-1);
    if (!match) {
        throw new Error(
            `iOS simulator '${name}' is not installed. Create it in Xcode > Windows > Devices and Simulators.`,
        );
    }
    return match;
}

async function grabFrame(device: ShowcaseDevice, target: string): Promise<Buffer> {
    if (device.platform === 'ios') {
        // simctl only writes to a file, so stage one and read it straight back.
        const staged = NodePath.join(
            await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), 'emitsignal-frame-')),
            'frame.png',
        );
        await runCommand('xcrun', ['simctl', 'io', target, 'screenshot', staged]);
        const bytes = await NodeFSP.readFile(staged);
        await NodeFSP.rm(NodePath.dirname(staged), { force: true, recursive: true });
        return bytes;
    }
    return await new Promise<Buffer>((resolve, reject) => {
        NodeChildProcess.execFile(
            ADB,
            ['-s', target, 'exec-out', 'screencap', '-p'],
            { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
            (error, stdout) => (error ? reject(error) : resolve(stdout)),
        );
    });
}

function killProcessTree(child: NodeChildProcess.ChildProcess, signal: NodeJS.Signals): void {
    if (child.pid === undefined) return;
    try {
        // Negative pid targets the whole group, which is where `expo start`
        // keeps the bundler that actually holds the port.
        process.kill(-child.pid, signal);
    } catch {
        child.kill(signal);
    }
}

/** Points the dev client at the harness's Metro server and waits for the bundle. */
async function launchApp(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
    config: ShowcaseConfig,
    awaitFirstRun: boolean,
): Promise<void> {
    // Android reaches the host's loopback through the adb reverse tunnels.
    const metroUrl = encodeURIComponent(`http://127.0.0.1:${config.metroPort}`);
    await openScene(
        app,
        device,
        target,
        `${app.scheme}://expo-development-client/?url=${metroUrl}`,
    );

    if (awaitFirstRun) {
        // The app writes its device id as soon as React mounts, which makes it a
        // real readiness signal for the very first launch — far better than
        // guessing how long a cold bundle takes.
        await waitForDeviceId(app, device, target, config.bundleLoadTimeoutMs);
        await delay(config.bundleLoadDelayMs);
        return;
    }
    // On a relaunch the device id is already there, so there is nothing to poll
    // for and the wait has to be a plain one.
    await delay(config.relaunchSettleMs);
}

async function main(): Promise<void> {
    const options = parseShowcaseCliArgs(process.argv.slice(2));
    if (options.list) {
        printUsage(showcaseConfig);
        return;
    }

    const devices = selectDevices(showcaseConfig, options.deviceIds);
    const scenes = selectScenes(options.scenes);
    const outputDirectory = NodePath.resolve(REPO_ROOT, showcaseConfig.outputDirectory);
    const log = (line: string) => process.stdout.write(`${line}\n`);

    // Started before anything else and stopped last: the published messages
    // point at it, and the app loads those images while each scene renders.
    const media = await startShowcaseMediaServer(log);
    log(`Serving showcase media on ${media.origin}`);

    let metro: NodeChildProcess.ChildProcess | null = null;
    const cleanups: Array<() => Promise<void>> = [];
    try {
        if (!options.skipMetro) {
            await assertPortFree(showcaseConfig.metroPort);
            log(`Starting Metro on :${showcaseConfig.metroPort} against ${API_URL}…`);
            metro = spawnProcess(
                'bunx',
                [
                    'expo',
                    'start',
                    '--dev-client',
                    '--clear',
                    '--port',
                    String(showcaseConfig.metroPort),
                ],
                {
                    cwd: MOBILE_ROOT,
                    // Metro inlines EXPO_PUBLIC_* at bundle time, and the package's
                    // .env points at production. Without this the app would read a
                    // different API than the one the harness just seeded, and every
                    // signed-in scene would render empty.
                    // Its own process group: `expo start` spawns a tree, and
                    // orphaning it leaves a stale bundler squatting on the port
                    // that the next run would silently capture against.
                    detached: true,
                    env: { ...process.env, EXPO_PUBLIC_API_URL: API_URL },
                    stdio: 'ignore',
                },
            );
            await waitForPort(showcaseConfig.metroPort, 'Metro');
        }

        for (const device of devices) {
            log(`\n${device.id}`);
            cleanups.push(
                await captureDevice(device, scenes, showcaseConfig, outputDirectory, log),
            );
        }

        log(`\nDone. ${NodePath.relative(REPO_ROOT, outputDirectory)}/`);
    } finally {
        for (const cleanup of cleanups) await cleanup().catch(() => undefined);
        if (metro) await stopProcess(metro);
        media.stop();
    }
}

async function normalizeAndroidEmulator(
    device: ShowcaseAndroidDevice,
    serial: string,
): Promise<void> {
    for (const scale of [
        'window_animation_scale',
        'transition_animation_scale',
        'animator_duration_scale',
    ]) {
        await runAdb(serial, ['shell', 'settings', 'put', 'global', scale, '0']);
    }
    await runAdb(serial, ['shell', 'cmd', 'uimode', 'night', 'yes']);
    await runAdb(serial, ['shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1']);
    // Demo mode is the only reliable way to get a clean status bar; the
    // immersive policy_control trick stopped working on Android 14.
    await runAdb(serial, [
        'shell',
        'am',
        'broadcast',
        '-a',
        'com.android.systemui.demo',
        '-e',
        'command',
        'enter',
    ]);
    await runAdb(serial, [
        'shell',
        'am',
        'broadcast',
        '-a',
        'com.android.systemui.demo',
        '-e',
        'command',
        'clock',
        '-e',
        'hhmm',
        '0941',
    ]);
    await runAdb(serial, [
        'shell',
        'am',
        'broadcast',
        '-a',
        'com.android.systemui.demo',
        '-e',
        'command',
        'battery',
        '-e',
        'level',
        '100',
        '-e',
        'plugged',
        'false',
    ]);
    await runAdb(serial, [
        'shell',
        'am',
        'broadcast',
        '-a',
        'com.android.systemui.demo',
        '-e',
        'command',
        'notifications',
        '-e',
        'visible',
        'false',
    ]);
    await runAdb(serial, [
        'shell',
        'wm',
        'size',
        `${device.viewport.width}x${device.viewport.height}`,
    ]);
    await runAdb(serial, ['shell', 'wm', 'density', String(device.viewport.density)]);
}

async function normalizeIosSimulator(udid: string): Promise<void> {
    await runCommand('xcrun', ['simctl', 'ui', udid, 'appearance', 'dark']);
    await runCommand('xcrun', [
        'simctl',
        'status_bar',
        udid,
        'override',
        '--time',
        '9:41',
        '--batteryState',
        'charged',
        '--batteryLevel',
        '100',
        '--wifiBars',
        '3',
        '--cellularBars',
        '4',
    ]);
}

async function openScene(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
    url: string,
): Promise<void> {
    if (device.platform === 'ios') {
        await runCommand('xcrun', ['simctl', 'openurl', target, url]);
    } else {
        await runAdb(target, [
            'shell',
            'am',
            'start',
            '-a',
            'android.intent.action.VIEW',
            '-d',
            url,
            app.appId,
        ]);
    }
}

async function patchAppStorage(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
    patch: AppStorage,
): Promise<void> {
    if (device.platform === 'ios') await patchIosStorage(target, app.appId, patch);
    else await patchAndroidStorage(ADB, target, app.appId, patch);
}

function printUsage(config: ShowcaseConfig): void {
    process.stdout.write(`EmitSignal store screenshot harness

Usage:
  bun scripts/mobile-showcase/showcase.ts [options]

Options:
  --device <id>     Capture one configured device (repeatable)
  --scene <name>    Capture one scene (repeatable)
  --skip-metro      Reuse an already running showcase Metro server
  --list            Print this help and the configured matrix

Scenes: ${SHOWCASE_SCENES.join(', ')}
App:    default APP_MODE=${APP_MODE}, API ${API_URL}

Devices:
${config.devices
    .map((device) => {
        const target = device.platform === 'ios' ? device.simulator : device.avd;
        return `  ${device.id.padEnd(12)} ${device.platform.padEnd(8)} ${target.padEnd(22)} → ${device.storeAsset.directory} (${device.storeAsset.width}×${device.storeAsset.height})`;
    })
    .join('\n')}
`);
}

/**
 * The app mints this UUID on first launch and scopes every anonymous
 * subscription to it, so the harness has to read it back rather than choose it.
 */
async function readDeviceId(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
): Promise<string> {
    const storage =
        device.platform === 'ios'
            ? await readIosStorage(target, app.appId)
            : await readAndroidStorage(ADB, target, app.appId);
    const deviceId = storage[DEVICE_ID_KEY];
    if (!deviceId) {
        throw new Error(
            `${app.appId} has not written ${DEVICE_ID_KEY} yet. The bundle probably failed to load — check Metro.`,
        );
    }
    return deviceId;
}

/**
 * Reinstalls the app from the copy already on the device. A plain data wipe
 * leaves the keychain untouched, so a session from manual testing would survive
 * and the anonymous scenes would render signed in.
 */
async function resetIosApp(appId: string, udid: string): Promise<void> {
    const installed = (
        await commandOutput('xcrun', ['simctl', 'get_app_container', udid, appId, 'app']).catch(
            () => '',
        )
    ).trim();
    if (!installed) {
        throw new Error(
            `${appId} is not installed on the simulator. Install it once with 'bun run ios' inside packages/emitsignal-mobile.`,
        );
    }
    const staged = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), 'emitsignal-showcase-'));
    const bundle = NodePath.join(staged, NodePath.basename(installed));
    await runCommand('cp', ['-R', installed, bundle]);
    await runCommand('xcrun', ['simctl', 'uninstall', udid, appId]);
    await runCommand('xcrun', ['simctl', 'install', udid, bundle]);
    await NodeFSP.rm(staged, { force: true, recursive: true });
}

async function restoreAndroidEmulator(serial: string): Promise<void> {
    await runAdb(serial, [
        'shell',
        'am',
        'broadcast',
        '-a',
        'com.android.systemui.demo',
        '-e',
        'command',
        'exit',
    ]).catch(() => undefined);
    await runAdb(serial, ['shell', 'wm', 'size', 'reset']).catch(() => undefined);
    await runAdb(serial, ['shell', 'wm', 'density', 'reset']).catch(() => undefined);
}

async function runAdb(serial: string, args: ReadonlyArray<string>): Promise<void> {
    await runCommand(ADB, ['-s', serial, ...args]);
}

async function runCommand(
    command: string,
    args: ReadonlyArray<string>,
    options: NodeChildProcess.SpawnOptions = {},
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawnProcess(command, args, {
            stdio: ['ignore', 'ignore', 'pipe'],
            ...options,
        });
        // Without the tool's own stderr these failures report only an exit code,
        // which says nothing about which simulator or package was wrong.
        let stderr = '';
        child.stderr?.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        child.once('error', reject);
        child.once('exit', (code, signal) => {
            if (code === 0) resolve();
            else
                reject(
                    new Error(
                        `${command} ${args.join(' ')} failed ${signal ? `with signal ${signal}` : `with code ${String(code)}`}.${stderr.trim() ? `\n${stderr.trim()}` : ''}`,
                    ),
                );
        });
    });
}

async function runningAndroidAvds(): Promise<ReadonlyMap<string, string>> {
    const serials = (await commandOutput(ADB, ['devices']))
        .split('\n')
        .map((line) => line.trim().split(/\s+/u))
        .filter((parts) => parts[0]?.startsWith('emulator-') && parts[1] === 'device')
        .map((parts) => parts[0] as string);
    const result = new Map<string, string>();
    for (const serial of serials) {
        const name = (await adbOutput(serial, ['emu', 'avd', 'name'])).split('\n')[0]?.trim();
        if (name) result.set(name, serial);
    }
    return result;
}

function spawnProcess(
    command: string,
    args: ReadonlyArray<string>,
    options: NodeChildProcess.SpawnOptions = {},
): NodeChildProcess.ChildProcess {
    return NodeChildProcess.spawn(command, args, {
        cwd: REPO_ROOT,
        env: process.env,
        stdio: 'inherit',
        ...options,
    });
}

async function stopProcess(child: NodeChildProcess.ChildProcess): Promise<void> {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
    killProcessTree(child, 'SIGTERM');
    await Promise.race([exited, delay(5_000)]);
    if (child.exitCode === null && child.signalCode === null) killProcessTree(child, 'SIGKILL');
}

async function suppressAndroidDevMenu(appId: string, serial: string): Promise<void> {
    const preferences = `<?xml version="1.0" encoding="utf-8" standalone="yes" ?>
<map>
  <boolean name="isOnboardingFinished" value="true" />
  <boolean name="showsAtLaunch" value="false" />
  <boolean name="showFab" value="false" />
  <boolean name="motionGestureEnabled" value="false" />
  <boolean name="touchGestureEnabled" value="false" />
  <boolean name="keyCommandsEnabled" value="false" />
</map>`;
    const encoded = Buffer.from(preferences).toString('base64');
    await runAdb(serial, [
        'shell',
        `run-as ${appId} sh -c 'mkdir -p shared_prefs && printf %s ${encoded} | base64 -d > shared_prefs/expo.modules.devmenu.sharedpreferences.xml'`,
    ]);
}

/**
 * Written straight after install, before the first launch: cfprefsd caches an
 * app's preferences once it has read them, and a later write needs a reboot to
 * take effect.
 */
async function suppressIosDevMenu(appId: string, udid: string): Promise<void> {
    for (const [key, value] of [
        ['EXDevMenuIsOnboardingFinished', 'true'],
        ['EXDevMenuShowFloatingActionButton', 'false'],
        ['EXDevMenuShowsAtLaunch', 'false'],
    ] as const) {
        await runCommand('xcrun', [
            'simctl',
            'spawn',
            udid,
            'defaults',
            'write',
            appId,
            key,
            '-bool',
            value,
        ]);
    }
}

async function terminateApp(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
): Promise<void> {
    if (device.platform === 'ios') {
        await runCommand('xcrun', ['simctl', 'terminate', target, app.appId]).catch(
            () => undefined,
        );
    } else {
        await runAdb(target, ['shell', 'am', 'force-stop', app.appId]).catch(() => undefined);
    }
    await delay(1_500);
}

async function waitForAndroidSerial(avd: string, timeoutMs = 180_000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const serial = (await runningAndroidAvds()).get(avd);
        if (serial) {
            const booted = (
                await adbOutput(serial, ['shell', 'getprop', 'sys.boot_completed'])
            ).trim();
            if (booted === '1') return serial;
        }
        await delay(1_000);
    }
    throw new Error(`Android AVD '${avd}' did not finish booting within ${timeoutMs}ms.`);
}

async function waitForDeviceId(
    app: ShowcaseApp,
    device: ShowcaseDevice,
    target: string,
    timeoutMs: number,
): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const deviceId = await readDeviceId(app, device, target).catch(() => '');
        if (deviceId) return deviceId;
        await delay(2_000);
    }
    throw new Error(
        `${app.appId} did not start within ${timeoutMs}ms. Check that Metro is serving the bundle.`,
    );
}

async function waitForPort(port: number, label: string, timeoutMs = 120_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const open = await new Promise<boolean>((resolve) => {
            const socket = NodeNet.createConnection({ host: '127.0.0.1', port });
            socket.once('connect', () => {
                socket.destroy();
                resolve(true);
            });
            socket.once('error', () => resolve(false));
            socket.setTimeout(500, () => {
                socket.destroy();
                resolve(false);
            });
        });
        if (open) return;
        await delay(500);
    }
    throw new Error(`${label} did not listen on port ${port} within ${timeoutMs}ms.`);
}

if (import.meta.main) {
    main().catch((error: unknown) => {
        process.stderr.write(
            `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
        );
        NodeProcess.exit(1);
    });
}
