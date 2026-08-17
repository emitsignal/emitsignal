# Versioning

EmitSignal follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

## One product version

There is a **single product version** for EmitSignal. It spans the server, website,
mobile app, CLI, and shared package together — [CHANGELOG.md](./CHANGELOG.md) tracks that
one version, not per-package versions.

Every `package.json` in the workspace carries that same version, and release-please
rewrites all of them together on each release (see `release-please-config.json`). The
mobile app derives its store version from `packages/emitsignal-mobile/package.json` via
`app.config.ts`; build numbers stay on EAS (`cli.appVersionSource: "remote"`).

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

## Release flow

Releases are automated by [release-please](https://github.com/googleapis/release-please)
(`.github/workflows/release.yml`). Nothing is versioned or changelogged by hand.

1. Land Conventional Commits on `main`. Every push updates a bot-maintained release PR
   titled `chore(main): release X.Y.Z`, which carries the version bump for every
   `package.json` and the new `CHANGELOG.md` section.
2. Review that PR — it is the release proposal. Edit the changelog wording there if the
   generated text needs polish; the commit subjects are what readers will see.
3. Merge it. That tags `vX.Y.Z`, creates the GitHub release, and publishes the CLI to npm,
   GitHub Releases, and the Homebrew tap.

Breaking changes must use a `!` suffix or a `BREAKING CHANGE:` footer — that is what drives
the major bump and the callout in the release notes.

### Changelog sources

`CHANGELOG.md` at the repository root is the single source of truth. The public changelog
page renders it: `packages/emitsignal-website/scripts/sync-changelog.ts` parses the markdown
into `src/data/changelog.generated.ts` on every `dev`, `build`, and `test`. Do not edit that
generated file, and do not add release entries to `changelog.tsx`.

Section headings map onto the page's three buckets — `### Added` (from `feat`),
`### Improved` (from `perf`), and `### Fixed` (from `fix`). A paragraph placed directly under
a version heading renders as that release's highlighted note.
