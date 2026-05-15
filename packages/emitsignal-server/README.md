# @emitsignal/server

Bun + Elysia backend for the EmitSignal notification platform. Handles topic-based pub/sub with real-time SSE fan-out and queued email delivery.

## Stack

- **Runtime:** Bun
- **HTTP framework:** Elysia with OpenAPI
- **ORM:** Prisma 7 + `@prisma/adapter-libsql` (SQLite via libSQL)
- **Queue:** BullMQ backed by Redis
- **Email:** React Email templates rendered to HTML, delivered via SMTP or Resend
- **Real-time:** SSE (`text/event-stream`) with in-process `EventEmitter`
- **Logging:** Pino

## Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | Start API server with hot reload         |
| `bun run dev:worker`  | Start email queue worker with hot reload |
| `bun run db:migrate`  | Run Prisma migrations                    |
| `bun run db:generate` | Generate Prisma client                   |
| `bun run db:seed`     | Seed database with sample data           |
| `bun run db:studio`   | Launch Prisma Studio GUI                 |

## Getting Started

```bash
cp .env.example .env
bun install
docker compose up -d      # start Redis
bun run db:migrate
bun run db:generate
bun run db:seed

# Terminal 1 — email worker
bun run dev:worker

# Terminal 2 — API server
bun run dev
```

The server listens on port `3333` by default (`EMIT_SIGNAL_HTTP_PORT`).

## Endpoints

| Method   | Path                              | Description                       |
| -------- | --------------------------------- | --------------------------------- |
| `GET`    | `/`                               | Health check                      |
| `POST`   | `/auth/magic-link`                | Request a magic sign-in code      |
| `POST`   | `/auth/verify`                    | Verify code and get session token |
| `GET`    | `/auth/me`                        | Current user (Bearer token)       |
| `GET`    | `/topics`                         | List topics (`?q=` for search)    |
| `GET`    | `/topics/:name`                   | Topic details with message count  |
| `GET`    | `/topics/:name/messages?limit=50` | Topic message history             |
| `GET`    | `/topics/:name/listen?since=<ms>` | SSE — backfill + live stream      |
| `GET`    | `/listen?topics=a,b,c`            | SSE — multi-topic live stream     |
| `POST`   | `/topics/:name`                   | Publish a message                 |
| `GET`    | `/subscriptions?deviceId=…`       | List device subscriptions         |
| `POST`   | `/subscriptions`                  | Subscribe device to topic         |
| `DELETE` | `/subscriptions`                  | Unsubscribe device from topic     |
| `POST`   | `/push-tokens`                    | Register Expo push token          |

### SSE event format

```
event: message
data: {"id":"…","title":"…","body":"…","priority":4,"tags":[…],"createdAt":…}
```

## Email Providers

Set `EMAIL_PROVIDER` in `.env`:

| Provider | Description                   | Required env vars                                  |
| -------- | ----------------------------- | -------------------------------------------------- |
| `log`    | Logs to console (dev default) | none                                               |
| `smtp`   | SMTP relay                    | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| `resend` | Resend API                    | `RESEND_API_KEY`                                   |

## Database

SQLite via libSQL. Default location: `./db/emitsignal-dev.db`.

```bash
# Create from scratch
rm -rf prisma/migrations db/
bun run db:migrate
bun run db:seed
```
