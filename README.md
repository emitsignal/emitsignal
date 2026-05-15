# EmitSignal

Real-time notification platform. Publish messages to topics, deliver via SSE and push notifications. Built with Bun, Elysia, Expo, and React Email.

## Packages

| Package                                              | Description                                 |
| ---------------------------------------------------- | ------------------------------------------- |
| [`@emitsignal/server`](./packages/emitsignal-server) | Elysia API — topics, auth, SSE, email queue |
| [`@emitsignal/mobile`](./packages/emitsignal-mobile) | Expo React Native app (iOS, Android, Web)   |
| [`@emitsignal/emails`](./packages/emitsignal-emails) | React Email templates                       |

## Prerequisites

- [Bun](https://bun.com) `>= 1.3`
- [Redis](https://redis.io) (for BullMQ email queue)

## Getting Started

```bash
bun install
```

### Start Redis

```bash
docker compose -f packages/emitsignal-server/docker-compose.yml up -d
```

### Run the server

```bash
cd packages/emitsignal-server
cp .env.example .env
bun run db:migrate
bun run db:generate
bun run db:seed
bun run dev:worker   # email worker (separate terminal)
bun run dev          # API server
```

### Run the mobile app

```bash
cd packages/emitsignal-mobile
bun run start
```

## Root Scripts

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `bun format`       | Format all files with Prettier   |
| `bun format:check` | Check formatting without writing |
| `bun lint`         | Run ESLint across the workspace  |
| `bun lint:fix`     | Run ESLint with auto-fix         |
| `bun dev`          | Run `dev` script in all packages |

## Architecture

```
┌─────────────┐     SSE/HTTP     ┌─────────────┐     BullMQ     ┌─────────────┐
│   Mobile    │ ◄─────────────── │   Server     │ ─────────────► │   Worker    │
│  (Expo/RN)  │                  │  (Elysia)    │                │  (email)    │
└─────────────┘                  └──────┬───────┘                └──────┬──────┘
                                        │                               │
                                        │  libsql (SQLite)               │
                                        ▼                               ▼
                                  ┌──────────┐                  ┌──────────────┐
                                  │  Prisma  │                  │  Email       │
                                  │          │                  │  Provider    │
                                  └──────────┘                  │ (smtp/resend)│
                                                                └──────────────┘
```

Users publish messages to topics. Subscribers receive them in real-time via SSE (mobile app). Server fires emails (magic link, alerts, digests) through a BullMQ-backed queue processed by a separate worker.
