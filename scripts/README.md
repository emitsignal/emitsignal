# Publish test scripts

Manual test harness for the publish route, `POST /topic/:name`
([`packages/emitsignal-server/src/http/topic/publish.ts`](../packages/emitsignal-server/src/http/topic/publish.ts)).
Every branch of that route — JSON body, header-based publish, priorities, tags, actions, media,
scheduling and each rejection path — has a scenario here.

| File                   | What it is                                                |
| ---------------------- | --------------------------------------------------------- |
| `publish.ts`           | Bun runner: sends every scenario and asserts the outcome  |
| `publish-scenarios.ts` | The scenario catalogue — add cases here                   |
| `publish-curl.sh`      | Copy-pasteable curl recipes for poking at the API by hand |

## Requirements

A running server (`docker compose -f packages/emitsignal-docker/docker-compose.dev.yml up`, or
`bun run dev` inside `packages/emitsignal-server`). Redis must be up: the publish limiter
**fails closed for anonymous publishers**, so with Redis down every anonymous publish is rejected.

## Bun runner

```bash
bun scripts/publish.ts --list                 # show scenarios, publish nothing
bun scripts/publish.ts                        # run all of them
bun scripts/publish.ts --group errors         # only the rejection paths
bun scripts/publish.ts --only action,header   # name substrings
bun scripts/publish.ts --only header-basic --dry-run   # print the curl command instead
```

| Option           | Default                                              |
| ---------------- | ---------------------------------------------------- |
| `--url <base>`   | `$EMITSIGNAL_API_URL` or `http://localhost:5001`     |
| `--topic <name>` | `$EMITSIGNAL_TOPIC` or `publish-playground`          |
| `--token <t>`    | `$EMITSIGNAL_TOKEN` — session token or `es_` API key |
| `--group <g>`    | `errors`, `headers`, `json`, `media`, `schedule`     |
| `--only <names>` | comma-separated names or substrings                  |
| `--delay <ms>`   | derived from the server rate limit                   |
| `--no-retry`     | fail fast on 429 instead of waiting out the limiter  |
| `--dry-run`      | print the equivalent `curl` and send nothing         |

Exit code is `1` if any scenario's outcome differs from what the route should return.

### Outcomes, not status codes

Each scenario declares one of `posted`, `scheduled` or `error`. That indirection matters because
publish reports failures two different ways:

- real HTTP errors — `400 missing_content`, `400 invalid_media`, `403 forbidden`,
  `429 daily_quota_exceeded`, `422` from the TypeBox body schema;
- **HTTP 200 with an `error` field in the body** — the `scheduledAt` more-than-a-year check and
  every `validateActions` rejection return `{ error, status: 400 }`, which Elysia serializes as a
  200 response.

The runner treats both as `error`, so the suite passes today and will flag it if that 200-with-error
quirk is ever tightened.

### Rate limits

Publishing is limited to **10/min anonymous** and **60/min authenticated**, so the runner paces
itself accordingly (~6s between requests anonymously, ~1s with a token) and, on a 429, waits out
`Retry-After` once before retrying. A full anonymous run therefore takes ~4 minutes — pass
`--token` to cut it to about one.

Get a token from the CLI (`bun packages/emitsignal-cli/src/index.ts auth login`, then read
`~/.config/emitsignal/config.json`) or create an API key in the web dashboard. Authenticated runs
also consume the plan's daily message quota (100/day on free).

## curl recipes

```bash
./scripts/publish-curl.sh list        # what's available
./scripts/publish-curl.sh basic       # one recipe
./scripts/publish-curl.sh all         # everything, 1s apart
```

Same environment variables as the runner (`EMITSIGNAL_API_URL`, `EMITSIGNAL_TOPIC`,
`EMITSIGNAL_TOKEN`), plus `EMITSIGNAL_SLEEP` for the pause `all` inserts between recipes.

## Watching the messages arrive

The non-scheduled scenarios fan out over SSE immediately:

```bash
curl -N http://localhost:5001/topics/publish-playground/listen
# or
bun packages/emitsignal-cli/src/index.ts listen publish-playground
```

Scheduled ones skip the bus and land on the `schedule` queue, so they only show up once the
schedule worker (`bun run dev:worker`) fires them.

## Adding a scenario

Append to `scenarios` in `publish-scenarios.ts`:

```ts
{
    build: ({ topic }) => jsonRequest(topic, { body: 'Body', title: 'Title' }),
    description: 'What this covers',
    expect: 'posted',
    group: 'json',
    name: 'my-scenario',
}
```

`jsonRequest` sends `application/json`; `headerRequest` sends any other content type, which is what
routes the request through the header parser in `src/lib/header-publish.ts`.

## Note on version control

`.gitignore` still ends with `scripts/*`, so new files here are ignored by default. The
entries this folder needs are un-ignored explicitly:

```gitignore
scripts/*
!scripts/mobile-showcase/
!scripts/README.md
!scripts/publish*
```

Add an exception when you add a script that should be tracked.
