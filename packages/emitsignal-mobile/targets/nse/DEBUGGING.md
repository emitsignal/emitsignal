# NSE widget-sync — status and how to resume debugging

## What this branch contains

Push-driven widget updates for iOS. A Notification Service Extension (NSE)
runs for every visible push (`mutable-content: 1`), patches the shared widget
snapshot in the app-group `UserDefaults`, and reloads the widget timelines —
so widgets update while the app is backgrounded or terminated.

- `targets/nse/` — the extension (`NotificationService.swift`, target config).
- `targets/_shared/widget-snapshot-shared.swift` — `WidgetSnapshot` model and
  `SharedStore`, compiled into the app, the widgets, and the NSE. Any field
  added to the TypeScript snapshot (`lib/widget-snapshot-builder.ts`) MUST be
  mirrored here, or the NSE's decode→re-encode silently drops it.
- `targets/widgets/Snapshot.swift` — slimmed to widget-only presentation.
- `lib/widget-snapshot.ts`, `hooks/use-widget-sync.ts`,
  `hooks/use-foreground-notifications.ts` — sync-trigger fixes: full re-sync on
  foreground (reconciles NSE approximations), network-free `cached-only` sync
  on background, debounced sync when a push arrives in the foreground.

The server side (already on `main`, commit `06cdf1c`) sets
`mutableContent: true` and adds `createdAt`/`priority` to the push `data`.

## Current status (2026-08-04)

Verified on a physical iPhone (preview build):

- The `nse` target builds, is provisioned (`com.emitsignal.preview.nse`), and
  **launches on push** — device Console shows
  `[com.emitsignal.preview.nse] Extension started`.
- BUT the widget snapshot is **not** patched: the extension bails somewhere
  inside `patchSnapshot` without visible errors. The previous build had no
  logging, so the bail point is unknown.
- `NotificationService.swift` has since been instrumented with `os_log`
  (subsystem `com.emitsignal.nse`) on every exit path, and the payload parsing
  was hardened (data under `body` as dict, as JSON string, or root-level).
  **No build with this instrumentation has been tested on a device yet.**

Ruled out already — do not re-investigate:

- Xcode wiring (entitlements, `_shared` membership in all three targets,
  generated Info.plist principal class) — verified correct via clean
  `npx expo prebuild -p ios --clean`.
- Push delivery: pushes arrive with `mutableContent: YES` (confirmed in device
  logs) and the extension launches.
- Simulator repro: **impossible** — `xcrun simctl push` displays notifications
  but never invokes service extensions. Do not waste time there; only the
  snapshot-patch logic could be unit-tested off-device.

## How to resume

1. Build and install: `eas build --platform ios --profile preview`.
2. On the Mac: Console.app → select the iPhone → Start streaming → filter
   `com.emitsignal.nse`.
3. Send a test push (bypasses the server; use the current token from the
   `PushToken` table and any subscribed topic):

   ```bash
   curl -sS -X POST https://exp.host/--/api/v2/push/send \
     -H "Authorization: Bearer $EXPO_ACCESS_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{
       "to": "ExponentPushToken[...]",
       "title": "device/two",
       "subtitle": "NSE debug",
       "body": "test",
       "mutableContent": true,
       "priority": "high",
       "data": {
         "messageId": "debug-'$(date +%s)'",
         "topicId": "<topic id>",
         "topicName": "device/two",
         "priority": 5,
         "createdAt": '$(date +%s000)'
       }
     }'
   ```

   `EXPO_ACCESS_TOKEN` lives in `packages/emitsignal-server/.env`. Use a fresh
   `messageId` each time — the NSE dedups by id.

4. Read the log line and apply the mapped fix:

   | Log line | Meaning / fix |
   | --- | --- |
   | `no data payload; userInfo keys: ...` | Expo nests `data` differently than assumed — adjust `extractData` to the key list shown. |
   | `data missing ids; data keys: ...` | Same, finer-grained. |
   | `snapshot missing or undecodable in app group ...` | App-group mismatch or decode failure — compare the logged group with the app's `extra.appGroup`, and the Swift struct against the JSON the app writes. |
   | `duplicate message ...` | Dedup false positive — inspect ids. |
   | `snapshot patched and timelines reloaded` (widget still static) | Patch works; the problem is the WidgetKit reload — try `WidgetCenter.shared.reloadTimelines(ofKind:)` per kind, or check reload-budget throttling. |

5. After the fix is confirmed end-to-end (post a real message with the app
   force-quit; widget updates without opening the app):
   - Quiet the logging: drop the per-push info logs or mark payload values
     `.private`; keep the error paths.
   - Run `bun test` and `bun lint`, then merge.

## Expected end-to-end behavior once fixed

Publish → worker sends push with `mutableContent` → iOS launches the NSE →
snapshot patched (message prepended, unread/channel/volume counters bumped,
`updatedAt` refreshed) → widgets reload within ~1–2 s of the banner. The app's
next foreground sync rebuilds the snapshot from real data, correcting the
NSE's approximations (`todayMoreCount`, activity buckets, read state).
