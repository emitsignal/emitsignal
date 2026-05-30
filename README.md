# EmitSignal

Real-time notification platform. Publish messages to topics, deliver via SSE and push notifications. Built with Bun, Elysia, Expo, and React Email.

## Packages

| Package                                                | Description                                     |
| ------------------------------------------------------ | ----------------------------------------------- |
| [`@emitsignal/server`](./packages/emitsignal-server)   | Elysia API — topics, auth, SSE, queued delivery |
| [`@emitsignal/website`](./packages/emitsignal-website) | TanStack Start web dashboard                    |
| [`@emitsignal/mobile`](./packages/emitsignal-mobile)   | Expo React Native app (iOS, Android, Web)       |
| [`@emitsignal/emails`](./packages/emitsignal-emails)   | React Email templates                           |

## Prerequisites

- [Bun](https://bun.com) `>= 1.3`
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL, Redis, and SMTP in development)

## Getting Started

Install dependencies from the root:

```bash
bun install
```

### Start development services

```bash
docker compose -f packages/emitsignal-docker/docker-compose.dev.yml up
```

This starts PostgreSQL, Redis, an SMTP inbox (Kafrainbox at [localhost:3134](http://localhost:3134)), the API server (port 5100), all workers, and the website (port 5173) — all with hot reload.

### Manual setup (without Docker)

```bash
cd packages/emitsignal-server
cp .env.example .env          # edit DATABASE_URL, REDIS_URL, etc.
bun run db:migrate
bun run db:seed
bun run dev:worker            # all workers (separate terminal)
bun run dev                   # API server
```

```bash
cd packages/emitsignal-website
bun run dev                   # web dashboard
```

```bash
cd packages/emitsignal-mobile
bun run start                 # Expo dev server
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
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│   Website   │  SSE/HTTP    │   Server    │   BullMQ     │   Workers   │
│  (TanStack) │ ◄──────────► │  (Elysia)   │ ────────────► │ email/push/ │
└─────────────┘              └──────┬──────┘              │  schedule   │
                                    │                      └──────┬──────┘
┌─────────────┐              ┌──────┴──────┐                     │
│   Mobile    │  SSE/HTTP    │  PostgreSQL  │              ┌──────┴──────┐
│  (Expo/RN)  │ ◄──────────► │  + Redis    │              │   Email     │
└─────────────┘              └─────────────┘              │  Provider   │
                                                           │ smtp/resend │
                                                           └─────────────┘
```

Users publish messages to topics. Subscribers receive them in real-time via SSE (website and mobile app). Server dispatches emails and push notifications through BullMQ queues processed by dedicated workers.
