# Mobile showcase — store screenshots

Boots each configured simulator/emulator, puts the app into a known anonymous state, walks
the screens by deep link, and writes upload-ready PNGs validated against the App Store and
Google Play specs.

```bash
bun run showcase --list                          # print the matrix, capture nothing
bun run showcase                                 # every device, every scene
bun run showcase --device iphone-6.9             # one device
bun run showcase --device pixel --scene feed     # one scene
bun run showcase --device ipad-13 --skip-metro   # reuse a running showcase Metro
```

Output lands in `artifacts/app-store/screenshots/` (gitignored):

```
apple/iphone-6.9/     1320×2868   landing, sign-in, feed, message, channels, publish, settings
apple/ipad-13/        2064×2752   (same)
google-play/phone/    1080×1920   (same)
```

## Requirements

- The stack: `docker compose -f packages/emitsignal-docker/docker-compose.dev.yml up`.
  **Redis must be up** — the publish limiter fails closed for anonymous publishers, so
  without it every message is rejected.
- The app installed once on each device (`bun run ios` / `bun run android` inside
  `packages/emitsignal-mobile`). The harness reinstalls from the copy already on the
  device; it never builds. Set `appMode` per device in `showcase.config.ts` if the
  variants differ — here the simulators carry `com.emitsignal` and the emulator carries
  `com.emitsignal.development`.
- The simulators and AVD named in `showcase.config.ts`.
- Nothing else listening on `:8199` or `:8198`. A Metro left over from an earlier run would
  serve a stale bundle — including a stale `EXPO_PUBLIC_API_URL` — so the harness refuses to
  start rather than capture the wrong data. Your day-to-day `expo start` on `:8081` is fine.

Environment: `EMITSIGNAL_API_URL` (default `http://127.0.0.1:5001`) and `APP_MODE`
(`production` | `preview` | `development`, default `production`) which selects the bundle
id and URL scheme, mirroring `packages/emitsignal-mobile/app.config.ts`.

The harness starts its own Metro with `EXPO_PUBLIC_API_URL` pointed at `EMITSIGNAL_API_URL`
and `--clear`. Both matter: the package's `.env` points at production, `.env` never
overrides an already-set variable, and Metro's transform cache would otherwise keep serving
a bundle with the old value inlined. With `--skip-metro` you are responsible for starting
Metro the same way.

## How it works

**There is no UI automation.** An earlier version drove the app with Maestro; the subscribe
sheet turned out to be unusable that way — XCUITest's `viewHierarchy` endpoint returns HTTP
500 on that screen, and Maestro retry-loops on it for five minutes before failing. The
harness instead owns the two pieces of app state the screenshots depend on:

| State                             | How                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@emitsignal/device_id`           | Read out of AsyncStorage (`showcase-app-state.ts`). The app mints it on first launch and scopes every anonymous subscription to it. |
| `@emitsignal/onboarding_complete` | Written into AsyncStorage while the app is stopped. It is the only thing gating the tabs for a device with no account.              |
| Subscriptions                     | `POST /subscriptions` with that device id — exactly what the sheet in `app/modal.tsx` does.                                         |
| Navigation                        | Deep links.                                                                                                                         |

Reading the device id doubles as the readiness signal for the cold bundle, which is why the
first launch waits on it rather than on a fixed timer.

Two orderings are load-bearing:

- **`landing` and `sign-in` are captured first**, on the freshly wiped device, so a run needs
  one app reset at the start rather than a sign-out in the middle.
- **Content is published after the device subscribes.** A subscription only surfaces messages
  newer than itself, so this is what keeps the feed at exactly this run's twelve even though
  the topics are long-lived and every previous run left its messages behind. Publishing is
  therefore per device (~80s each) rather than once per run.

Demo content is the `showcase` group already catalogued in `../publish-scenarios.ts`,
published over the public API — no database access, no server changes. Anonymous publishing
is capped at 10/min, so it is paced.

Those messages carry banner images from `packages/emitsignal-website/public/static/showcase/`,
which are **not deployed** — pointing at production yields 404s and blank cards. The harness
serves that folder itself on `:8198` (reverse-tunnelled for Android) and sets
`EMITSIGNAL_MEDIA_BASE` accordingly. The harness prints which assets were requested and
not found at the end of a run.

That folder is itself gitignored (`packages/emitsignal-website/.gitignore`), so a fresh
clone has **no** showcase media and every banner renders empty until the files are put
back. Only `latency-p99.png` exists locally today — the message-detail chart — and the
other four the catalogue references (`pool-saturation.webp`, `error-rate.webp`,
`build-4821.log`, `backup-manifest.txt`) do not exist at all.

Android gets `adb reverse` for all three host ports (Metro, media, and the API), so
`127.0.0.1` means the same thing on both platforms and the published URLs stay identical.

## Known differences from the hand-made screenshots

**Settings shows the signed-out state.** `app/(tabs)/settings.tsx` renders the account card
only when a user is set; an anonymous device gets a _Sign in_ row instead. The previously
submitted screenshot showed an account with an email address. Capturing that version needs
a real session, which means signing in by hand — the harness deliberately has no OTP path.

**Android keeps one status-bar icon.** SystemUI demo mode fixes the clock and battery and
hides notifications, but the Safety Center shield is an ongoing system notification it will
not drop. It is small and dark-on-dark; the alternative is cropping the status bar, which
would cost the native 9:16 framing.

## Adding a device or scene

Edit `showcase.config.ts`. Each device declares its exact store upload spec, and every
capture is validated against it before the run is allowed to succeed, so a new Xcode or
emulator release cannot silently produce a file the store will reject.

For a new scene, add it to `SHOWCASE_SCENES` and give it a URL in `sceneUrl()` in
`showcase.ts`. Expo Router omits route groups from URLs, so `app/(tabs)/channels.tsx` is
`/channels`.

## Credit

Derived from the mobile screenshot harness in
[pingdotgg/t3code](https://github.com/pingdotgg/t3code), MIT licensed — see
`LICENSE.upstream`. The store-asset validators, the simulator and emulator
normalisation, and the device-matrix shape came from there; the scene navigation, the
AsyncStorage handling and the content pipeline are specific to EmitSignal.
