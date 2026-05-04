# EmitSignal · server

Bun + Elysia + Prisma backend for the EmitSignal notification platform. Real-time
fan-out is via Server-Sent Events.

## Stack

- **Runtime:** Bun
- **HTTP framework:** Elysia
- **ORM:** Prisma 7 with `@prisma/adapter-libsql` (SQLite via libSQL — Bun-compatible)
- **Real-time:** SSE (text/event-stream)
- **In-process pub/sub:** Node `EventEmitter` (swap for Redis/NATS for multi-node)

## Getting started

```bash
# 1. Install deps
bun install

# 2. Run the migration + generate the client
bun run db:migrate
bun run db:generate

# 3. Seed sample topics + messages
bun run db:seed

# 4. Start the dev server
bun run dev
```

The server listens on `http://localhost:3000`.

## Endpoints

| Method | Path                              | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/`                               | Health check                         |
| POST   | `/auth/magic-link`                | Request a 6-char magic code          |
| POST   | `/auth/verify`                    | Verify code → session token          |
| GET    | `/auth/me`                        | Current user (requires Bearer token) |
| GET    | `/topics`                         | List topics, optional `?q=` search   |
| GET    | `/topics/:name`                   | One topic with counts                |
| GET    | `/topics/:name/messages?limit=50` | List messages                        |
| GET    | `/topics/:name/listen?since=<ms>` | **SSE** — backfill + live stream     |
| GET    | `/listen?topics=a,b,c`            | **SSE** — multi-topic live stream    |
| POST   | `/topic/:name`                    | Publish a message                    |
| GET    | `/subscriptions?deviceId=…`       | List a device's subscriptions        |
| POST   | `/subscriptions`                  | Subscribe a device to a topic        |
| DELETE | `/subscriptions`                  | Unsubscribe a device                 |
| POST   | `/push-tokens`                    | Register an Expo push token          |

Topic names that contain `/` (e.g. `deploy/prod`) must be URL-encoded as
`deploy%2Fprod` when used as a path parameter.

## Publish a message

```bash
curl -X POST http://localhost:3000/topic/deploy%2Fprod \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy ok","body":"shipped","priority":4,"tags":["prod"]}'
```

## Listen on a topic (SSE)

```bash
curl -N http://localhost:3000/topics/deploy%2Fprod/listen
```

Each frame:

```
event: message
data: {"id":"…","title":"…","body":"…","priority":4,"tags":[…],"createdAt":…}
```
