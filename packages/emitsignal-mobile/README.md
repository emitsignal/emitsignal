# @emitsignal/mobile

Expo React Native app for iOS, Android, and Web. Enables users to subscribe to topics, receive real-time message streams, and publish new messages.

## Features

- **Magic link authentication** — passwordless sign-in via email
- **Real-time messaging** — SSE connection to the EmitSignal server
- **Push notifications** — Expo push token registration for background alerts
- **Topic management** — subscribe/unsubscribe to topics, browse messages
- **Dark mode** — system-aware theme with manual override

## Scripts

| Script            | Description            |
| ----------------- | ---------------------- |
| `bun run start`   | Start Expo dev server  |
| `bun run ios`     | Start iOS simulator    |
| `bun run android` | Start Android emulator |
| `bun run web`     | Start web version      |
| `bun run lint`    | Run Expo ESLint        |

## Getting Started

```bash
bun install
bun run start
```

Requires the [EmitSignal server](../emitsignal-server) to be running. Set `EXPO_PUBLIC_API_URL` to the server address in your environment.

## Environment Variables

| Variable              | Default                 | Description         |
| --------------------- | ----------------------- | ------------------- |
| `EXPO_PUBLIC_API_URL` | `http://127.0.0.1:5001` | Server API base URL |
