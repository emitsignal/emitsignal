# Versioning

EmitSignal follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

## One product version

There is a **single product version** for EmitSignal. It spans the server, website,
mobile app, and shared package together — the [changelog](packages/emitsignal-website/src/routes/changelog.tsx)
tracks that one version, not per-package versions.

> The `package.json` files currently read a placeholder `1.0.0`, and the mobile app
> carries its own store build number via `app.config.ts`. Reconciling those with the
> product version is an optional follow-up.

## History

Versions `0.1.0`–`0.9.0` were reconstructed retroactively from the commit history to
tell a coherent release story. **`1.0.0` (2026-06-26) is the first stable public
release** — the point from which the rules below apply.

## Post-1.0 rules

| Bump      | When                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| **MAJOR** | Breaking change to a public contract: REST/SSE/webhook payloads, auth, or a DB migration that requires user action |
| **MINOR** | Backward-compatible feature — a new endpoint, a new publish option, a new auth method                              |
| **PATCH** | Bug fix, performance improvement, or internal refactor with no API change                                          |

### Conventional Commits → version bump

The repo uses [Conventional Commits](https://www.conventionalcommits.org/) (see `CLAUDE.md`).
They map to bumps as follows:

- `feat` → **minor**
- `fix` / `perf` → **patch**
- `feat!` or any commit with a `BREAKING CHANGE:` footer → **major**
- `chore` / `docs` / `refactor` / `style` / `test` / `ci` / `build` → no release on their own

## What's next

Shipping the `emitsignal` CLI and the Terminal UI (TUI) is **additive**, so it lands as
**`1.0.0`**, not a major bump. Their docs already live at `/cli`.

## Release flow

1. Tag the release `vX.Y.Z`.
2. Add a matching entry at the top of `packages/emitsignal-website/src/routes/changelog.tsx`
   (`added` / `improved` / `fixed`, newest first).
3. Flag any breaking change with the entry's `note` field.
