// Reads and writes the app's AsyncStorage from the host.
//
// Two keys decide what the screenshots show: the anonymous device id that scopes
// every subscription, and the onboarding flag that app/(tabs)/_layout.tsx gates
// the tab screens on. Owning both from here is what lets the harness drive the
// whole run with deep links instead of UI automation.

import { Database } from 'bun:sqlite';
import * as NodeChildProcess from 'node:child_process';
import * as NodeFSP from 'node:fs/promises';
import * as NodeOS from 'node:os';
import * as NodePath from 'node:path';
import * as NodeUtil from 'node:util';

export type AppStorage = Record<string, string>;

const execFile = NodeUtil.promisify(NodeChildProcess.execFile);

export const DEVICE_ID_KEY = '@emitsignal/device_id';
export const ONBOARDING_KEY = '@emitsignal/onboarding_complete';

// react-native-async-storage keeps small values inline in this manifest and
// spills larger ones to sibling files. Both of ours are tiny.
const IOS_STORAGE_PATH =
    'Library/Application Support/{appId}/RCTAsyncLocalStorage_V1/manifest.json';
const ANDROID_DATABASE = 'databases/RKStorage';
const ANDROID_TABLE = 'catalystLocalStorage';

export async function patchAndroidStorage(
    adb: string,
    serial: string,
    appId: string,
    patch: AppStorage,
): Promise<void> {
    const { local, staged } = await pullAndroidDatabase(adb, serial, appId);
    const database = new Database(local);
    try {
        const statement = database.prepare(
            `INSERT INTO ${ANDROID_TABLE} (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        );
        for (const [key, value] of Object.entries(patch)) statement.run(key, value);
    } finally {
        database.close();
    }

    await execFile(adb, ['-s', serial, 'push', local, '/data/local/tmp/RKStorage']);
    await execFile(adb, [
        '-s',
        serial,
        'shell',
        // The write-ahead log would otherwise replay over the file just pushed.
        `run-as ${appId} sh -c 'cp /data/local/tmp/RKStorage ${ANDROID_DATABASE} && rm -f ${ANDROID_DATABASE}-wal ${ANDROID_DATABASE}-shm'`,
    ]);
    await NodeFSP.rm(staged, { force: true, recursive: true });
}

export async function patchIosStorage(
    udid: string,
    appId: string,
    patch: AppStorage,
): Promise<void> {
    const path = await iosStoragePath(udid, appId);
    const current = await readIosStorage(udid, appId);
    await NodeFSP.mkdir(NodePath.dirname(path), { recursive: true });
    await NodeFSP.writeFile(path, JSON.stringify({ ...current, ...patch }));
}

export async function readAndroidStorage(
    adb: string,
    serial: string,
    appId: string,
): Promise<AppStorage> {
    const { local, staged } = await pullAndroidDatabase(adb, serial, appId);
    const database = new Database(local, { readonly: true });
    try {
        const rows = database.prepare(`SELECT key, value FROM ${ANDROID_TABLE}`).all() as Array<{
            key: string;
            value: string;
        }>;
        return Object.fromEntries(rows.map((row) => [row.key, row.value]));
    } finally {
        database.close();
        await NodeFSP.rm(staged, { force: true, recursive: true });
    }
}

export async function readIosStorage(udid: string, appId: string): Promise<AppStorage> {
    const path = await iosStoragePath(udid, appId);
    const raw = await NodeFSP.readFile(path, 'utf8').catch(() => '');
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as AppStorage) : {};
}

async function iosStoragePath(udid: string, appId: string): Promise<string> {
    const { stdout } = await execFile('xcrun', [
        'simctl',
        'get_app_container',
        udid,
        appId,
        'data',
    ]);
    return NodePath.join(stdout.trim(), IOS_STORAGE_PATH.replace('{appId}', appId));
}

async function pullAndroidDatabase(
    adb: string,
    serial: string,
    appId: string,
): Promise<{ local: string; staged: string }> {
    const staged = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), 'emitsignal-storage-'));
    const local = NodePath.join(staged, 'RKStorage');
    // `adb pull` cannot read inside the app sandbox, so stream it out via run-as.
    const { stdout } = await execFile(
        adb,
        ['-s', serial, 'exec-out', `run-as ${appId} cat ${ANDROID_DATABASE}`],
        { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
    );
    await NodeFSP.writeFile(local, stdout as unknown as Uint8Array);
    return { local, staged };
}
