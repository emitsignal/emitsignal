// Capture matrix for the store screenshot harness. Edit this file — not the
// runner — to add a device, a scene, or a channel the screenshots should show.

export interface ShowcaseAndroidDevice {
    /** Build variant installed on this device. Defaults to $APP_MODE. */
    readonly appMode?: ShowcaseAppMode;
    /** Exact name from `emulator -list-avds`. */
    readonly avd: string;
    readonly id: string;
    readonly platform: 'android';
    readonly storeAsset: ShowcaseStoreAssetSpec;
    /**
     * Forced capture size. Play caps the long side at 2× the short side, so a
     * native 1080×2424 capture is rejected; resizing the emulator makes the
     * screencap natively 9:16 instead of cropping one afterwards.
     */
    readonly viewport: {
        readonly density: number;
        readonly height: number;
        readonly width: number;
    };
}

export type ShowcaseAppMode = 'development' | 'preview' | 'production';

export interface ShowcaseConfig {
    /** Settle time after the app is up, before the first screenshot. */
    readonly bundleLoadDelayMs: number;
    /** How long a cold bundle may take to load before the run gives up. */
    readonly bundleLoadTimeoutMs: number;
    readonly devices: ReadonlyArray<ShowcaseDevice>;
    readonly metroPort: number;
    readonly outputDirectory: string;
    /**
     * Settle time after the app is restarted to pick up the onboarding flag.
     * The dev client re-fetches the bundle here, which on Android is slow enough
     * to otherwise capture its "Reloading…" banner.
     */
    readonly relaunchSettleMs: number;
    readonly settleDelayMs: number;
}

export type ShowcaseDevice = ShowcaseAndroidDevice | ShowcaseIosDevice;

export interface ShowcaseIosDevice {
    /** Build variant installed on this device. Defaults to $APP_MODE. */
    readonly appMode?: ShowcaseAppMode;
    readonly id: string;
    readonly platform: 'ios';
    /** Exact name from `xcrun simctl list devices available`. */
    readonly simulator: string;
    readonly storeAsset: ShowcaseStoreAssetSpec;
}

export type ShowcaseScene = (typeof SHOWCASE_SCENES)[number];

export interface ShowcaseStoreAssetSpec {
    /** Device directory relative to ShowcaseConfig.outputDirectory. */
    readonly directory: string;
    readonly height: number;
    readonly maximumFileSizeBytes?: number;
    readonly maximumUploadCount: number;
    readonly minimumUploadCount: number;
    readonly store: 'apple' | 'google-play';
    readonly width: number;
}

/**
 * Capture order is load-bearing. The signed-out scenes come first so they can be
 * taken on a freshly wiped device, before onboarding runs; that way the whole
 * capture needs one app reset at the start rather than a sign-out in the middle.
 */
export const SHOWCASE_SCENES = [
    'landing',
    'sign-in',
    'feed',
    'message',
    'channels',
    'publish',
    'settings',
] as const;

/** Scenes that must be captured before the onboarding flow runs. */
export const PRE_ONBOARDING_SCENES: ReadonlyArray<ShowcaseScene> = ['landing', 'sign-in'];

/**
 * Channels subscribed to on top of the two `emitsignal/*` ones that onboarding
 * picks by default (see GET /suggestions). These are the topics the `showcase`
 * publish scenarios post to, so the feed and the channel list agree.
 */
export const SHOWCASE_TOPICS = [
    'alerts/prod',
    'deploy/prod',
    'ci/web',
    'cron/backup',
    'billing/stripe',
    'home/sensors',
] as const;

/** Picks which published message the `message` scene opens. */
export const SHOWCASE_MESSAGE_TITLE = 'Production API latency spike';

const config: ShowcaseConfig = {
    bundleLoadDelayMs: 6_000,
    bundleLoadTimeoutMs: 240_000,
    devices: [
        {
            id: 'iphone-6.9',
            platform: 'ios',
            simulator: 'iPhone 17 Pro Max',
            storeAsset: {
                directory: 'apple/iphone-6.9',
                height: 2868,
                maximumUploadCount: 10,
                minimumUploadCount: 1,
                store: 'apple',
                width: 1320,
            },
        },
        {
            id: 'ipad-13',
            platform: 'ios',
            simulator: 'iPad Pro 13-inch (M5)',
            storeAsset: {
                directory: 'apple/ipad-13',
                height: 2752,
                maximumUploadCount: 10,
                minimumUploadCount: 1,
                store: 'apple',
                width: 2064,
            },
        },
        {
            // The emulator here carries the development build, while the
            // simulators carry the production one.
            appMode: 'development',
            avd: 'Pixel_9',
            id: 'pixel',
            platform: 'android',
            storeAsset: {
                directory: 'google-play/phone',
                height: 1920,
                maximumFileSizeBytes: 8 * 1024 * 1024,
                maximumUploadCount: 8,
                minimumUploadCount: 2,
                store: 'google-play',
                width: 1080,
            },
            viewport: { density: 420, height: 1920, width: 1080 },
        },
    ],
    // A dedicated port so the harness cannot attach to a Metro server someone
    // already has running and capture the wrong bundle.
    metroPort: 8199,
    outputDirectory: 'artifacts/app-store/screenshots',
    relaunchSettleMs: 30_000,
    settleDelayMs: 2_500,
};

export default config;
