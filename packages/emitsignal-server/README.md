# @emitsignal/server

Bun + Elysia backend for the EmitSignal notification platform. Handles topic-based pub/sub with real-time SSE fan-out, queued email and push delivery, and file attachments.

## Stack

- **Runtime:** Bun
- **HTTP framework:** Elysia with OpenAPI
- **ORM:** Prisma + PostgreSQL
- **Queue:** BullMQ backed by Redis
- **Email:** React Email templates rendered to HTML, delivered via SMTP or Resend
- **Real-time:** SSE (`text/event-stream`) with in-process `EventEmitter`
- **File storage:** local disk or S3-compatible object storage
- **Logging:** Pino

## Scripts

| Script                        | Description                               |
| ----------------------------- | ----------------------------------------- |
| `bun run dev`                 | Start API server with hot reload          |
| `bun run dev:worker`          | Start all workers (email, push, schedule) |
| `bun run dev:worker:email`    | Start email worker only                   |
| `bun run dev:worker:push`     | Start push notification worker only       |
| `bun run dev:worker:schedule` | Start scheduled message worker only       |
| `bun run db:migrate`          | Run Prisma migrations                     |
| `bun run db:generate`         | Generate Prisma client                    |
| `bun run db:seed`             | Seed database with sample data            |
| `bun run db:studio`           | Launch Prisma Studio GUI                  |
| `bun test`                    | Run tests                                 |

## Getting Started

```bash
cp .env.example .env
bun install
docker compose -f ../emitsignal-docker/docker-compose.dev.yml up -d postgres redis
bun run db:migrate
bun run db:seed

# Terminal 1 — workers
bun run dev:worker

# Terminal 2 — API server
bun run dev
```

The server listens on port `3333` by default (`EMIT_SIGNAL_HTTP_PORT`).

## Endpoints

| Method   | Path                              | Description                       |
| -------- | --------------------------------- | --------------------------------- |
| `GET`    | `/`                               | Health check / version            |
| `POST`   | `/auth/magic-link`                | Request a magic sign-in code      |
| `POST`   | `/auth/verify`                    | Verify code and get session token |
| `GET`    | `/auth/me`                        | Current user (Bearer token)       |
| `GET`    | `/topics`                         | List topics (`?q=` for search)    |
| `GET`    | `/topics/:name`                   | Topic details with message count  |
| `GET`    | `/topics/:name/messages?limit=50` | Topic message history             |
| `GET`    | `/topics/:name/listen?since=<ms>` | SSE — backfill + live stream      |
| `GET`    | `/listen?topics=a,b,c`            | SSE — multi-topic live stream     |
| `POST`   | `/topic/:name`                    | Publish a message                 |
| `GET`    | `/suggestions`                    | Topic name suggestions (`?q=`)    |
| `GET`    | `/messages/:id`                   | Get a single message              |
| `POST`   | `/messages/:id/acknowledge`       | Acknowledge a message             |
| `POST`   | `/messages/:id/attachments`       | Upload a file attachment          |
| `GET`    | `/uploads/:file`                  | Serve a locally stored attachment |
| `GET`    | `/subscriptions?deviceId=…`       | List device subscriptions         |
| `POST`   | `/subscriptions`                  | Subscribe device to topic         |
| `DELETE` | `/subscriptions`                  | Unsubscribe device from topic     |
| `GET`    | `/push-tokens`                    | List push tokens for a device     |
| `POST`   | `/push-tokens`                    | Register Expo push token          |
| `PATCH`  | `/push-tokens/:id`                | Update a push token               |

### SSE event format

```
event: message
data: {"id":"…","title":"…","body":"…","priority":4,"tags":[…],"actions":[…],"createdAt":…}
```

## Environment Variables

| Variable                | Default                     | Description                                      |
| ----------------------- | --------------------------- | ------------------------------------------------ |
| `DATABASE_URL`          | —                           | PostgreSQL connection string                     |
| `REDIS_URL`             | `redis://localhost:6379`    | Redis connection string (BullMQ + rate limiting) |
| `JWT_SECRET`            | `emitsignal-dev-jwt-secret` | Secret for signing session tokens                |
| `APP_URL`               | `http://localhost:5001`     | Public base URL (used in magic link emails)      |
| `EMIT_SIGNAL_HTTP_PORT` | `3333`                      | HTTP server port                                 |
| `EMAIL_PROVIDER`        | `log`                       | `log` \| `smtp` \| `resend`                      |
| `EMAIL_FROM`            | `EmitSignal <noreply@…>`    | Sender address                                   |
| `FILE_STORAGE_PROVIDER` | `local`                     | `local` \| `s3`                                  |
| `UPLOAD_DIR`            | `./uploads`                 | Directory for local file uploads                 |

### SMTP (when `EMAIL_PROVIDER=smtp`)

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

### Resend (when `EMAIL_PROVIDER=resend`)

`RESEND_API_KEY`

### S3 (when `FILE_STORAGE_PROVIDER=s3`)

`S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (optional), `S3_PUBLIC_URL_BASE` (optional), `S3_FORCE_PATH_STYLE` (optional)

## Database

PostgreSQL via Prisma. Set `DATABASE_URL` in `.env`.

```bash
# Reset from scratch
bun run db:migrate
bun run db:seed
```
