# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

EmitSignal is a real-time notification platform. Publishers POST messages to named topics; subscribers receive them live via SSE. Emails and push notifications are dispatched asynchronously via BullMQ workers.

## Commands

**Always use `bun`, never `npm`, `yarn`, `pnpm`, or `node`.**

```bash
# Root (workspace-wide)
bun install            # install all dependencies
bun format             # format with Prettier (run before every commit)
bun format:check       # check formatting without writing
bun lint               # ESLint across all packages
bun lint:fix           # ESLint with auto-fix
bun test               # run all package tests

# Start everything via Docker (recommended for dev)
docker compose -f packages/emitsignal-docker/docker-compose.dev.yml up

# Server (packages/emitsignal-server)
bun run dev            # API server with --watch
bun run dev:worker     # all BullMQ workers with --watch
bun run db:migrate     # Prisma migrate dev
bun run db:seed        # seed the database
bun run db:studio      # open Prisma Studio
bun run db:generate    # regenerate Prisma client
bun test               # run server tests (Bun test runner)
bun test src/path/to/file.test.ts  # run a single test file

# Website (packages/emitsignal-website)
bun run dev            # Vite dev server on :5000
bun test               # Vitest

# Mobile (packages/emitsignal-mobile)
bun run start          # Expo dev server
bun run ios            # iOS simulator
bun run android        # Android emulator
bunx expo lint         # lint mobile package
```

## Architecture

```
Website (TanStack Start) ─┐
Mobile (Expo/RN)          ├── SSE/HTTP ──► Server (Elysia) ──► PostgreSQL
CLI                       ┘                    │                  Redis
                                               │ BullMQ queues
                                       Email / Push / Schedule workers
```

### Server (`packages/emitsignal-server`)

- **Framework:** Elysia on Bun; routes are Elysia plugins in `src/http/`
- **Database:** PostgreSQL via Prisma; schema at `prisma/schema.prisma`; generated client at `src/generated/prisma/`
- **Queues:** BullMQ backed by Redis (`src/lib/queue/`); three queues — `email`, `push`, `schedule`; workers run in `src/workers/`
- **SSE fanout:** `src/lib/event-bus.ts` — an in-process `EventEmitter` that powers the listen endpoints. Single-node only; replace with Redis pub/sub for multi-node. Transport plumbing (headers, frame encoding, heartbeat/cleanup) lives in `src/lib/sse.ts`; `GET /topics/:name/listen` and `GET /listen` are thin wrappers over one shared handler in `src/http/topic/sse-listen.ts`.
- **Auth:** Better Auth (`src/lib/auth.ts`) — magic link, passkey, API keys, optional GitHub OAuth. Auth is resolved per-request in `src/http/auth/plugin.ts`; supports cookie-based sessions (web) and `Bearer <session-token>` (mobile/CLI).
- **Rate limiting:** `rate-limiter-flexible` via Redis (`src/lib/rate-limit.ts`); applied globally via `src/http/plugins/rate-limit-plugin.ts`. Fails open if Redis is unavailable.
- **File storage:** provider-switched via `FILE_STORAGE_PROVIDER` env — `local` (default) or `s3` (`src/lib/storage/`)
- **Email provider:** switched via `EMAIL_PROVIDER` env — `log` (default/dev), `smtp`, or `resend`
- **Environment:** validated at startup by TypeBox schema in `src/schema/environment.ts`; all config accessed via the `environment` export

### Publish API

`POST /topic/:name` accepts either JSON body or a header-based format (parsed in `src/lib/header-publish.ts`). Non-JSON requests use headers like `title`, `x-priority` (`1`–`5` or `low`/`high`/`urgent`), `x-tags`, `x-delay` (unix timestamp or relative like `5m`, `2h`). Publish immediately fires the in-process bus and enqueues a push job; scheduled messages skip the bus and go straight to the schedule queue.

### Website (`packages/emitsignal-website`)

- **Framework:** TanStack Start (file-based routing in `src/routes/`)
- **Styling:** Tailwind CSS v4
- **Auth client:** `src/lib/auth-client.ts` — Better Auth React client pointed at `VITE_API_URL`
- **Path alias:** `#/*` → `./src/*`
- **Tests:** Vitest + Testing Library

### Mobile (`packages/emitsignal-mobile`)

- **Framework:** Expo SDK 54 / React Native 0.81.5 / Expo Router v6
- **Path alias:** `@/` → project root
- **Auth:** `@better-auth/expo` with Bearer session tokens
- **Context providers** (in `app/_layout.tsx`): `ThemeProvider` → `DebugSectionsProvider` → `SessionProvider` → `DeviceProvider`

### Shared (`packages/emitsignal-shared`)

Common TypeScript types (`Message`, `Topic`, `Subscription`, `Webhook`, etc.) and API helpers used by website and mobile.

## Code Style

- Functional components only; no class components
- No `any` — TypeScript strict mode enforced everywhere
- No abbreviations in identifiers (`subscription`, not `s`; `priority`, not `prio`)
- No inline `if` expressions
- `interface` for object shapes, `type` for unions/aliases
- Generics: descriptive names (`TResponse`, not `T`)
- File names: kebab-case; component names: PascalCase

## Commit Rules

Use [Conventional Commits](https://www.conventionalcommits.org/): `<prefix>: <description>`.

- Run `bun format` before committing; if Prettier modifies files, stage them and add a final `chore: Source Format` commit as the last commit in the sequence.
- Do **not** add `Co-authored-by:` trailers.
- Avoid commit bodies/footers unless the change has a breaking or high-impact side effect.
- Split commits by logical area; keep each commit focused on one concern.

| Prefix     | Use when                           |
| ---------- | ---------------------------------- |
| `feat`     | New feature                        |
| `fix`      | Bug fix                            |
| `refactor` | No bug fix, no new feature         |
| `style`    | Formatting/whitespace only         |
| `docs`     | Documentation only                 |
| `test`     | Adding/updating tests              |
| `chore`    | Maintenance, deps, tooling         |
| `perf`     | Performance improvement            |
| `ci`       | CI/CD changes                      |
| `build`    | Build system or dependency changes |
