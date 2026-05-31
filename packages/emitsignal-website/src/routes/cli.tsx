import { createFileRoute, Link } from '@tanstack/react-router';

import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';

export const Route = createFileRoute('/cli')({ component: CLIPage });

export default function CLIPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[860px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                        emitsignal-cli · v0.7.2
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        The emitsignal CLI
                    </h1>
                    <p className="mb-8 max-w-[600px] text-[18px] leading-[1.6] text-muted">
                        Publish, listen, and manage your signals from any shell. Works standalone
                        with no account — or pairs with your EmitSignal workspace for routing,
                        channels, and persistence.
                    </p>
                    <div className="mb-3 rounded-xl border border-line bg-deep px-5 py-4 font-mono text-[13.5px]">
                        <span className="text-dim">$</span>{' '}
                        <span className="text-success">brew install emitsignal</span>
                    </div>
                    <p className="font-mono text-[12px] text-dim">
                        or:{' '}
                        <span className="text-muted">curl -sSL emitsignal.com/install | sh</span>
                    </p>
                </div>
            </div>

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[860px]">
                    {/* Installation */}
                    <Section id="install">
                        <Kicker>Installation</Kicker>
                        <H2>Get it running in 30 seconds.</H2>
                        <P>
                            The CLI ships as a single static binary. No Node, no Python, no runtime.
                            Pick your method — they all install the same binary.
                        </P>

                        <div className="space-y-3">
                            <div>
                                <H3>Homebrew (macOS / Linux)</H3>
                                <Block>{`$ brew install emitsignal`}</Block>
                            </div>
                            <div>
                                <H3>Shell installer (Linux / macOS / WSL)</H3>
                                <Block>{`$ curl -sSL https://emitsignal.com/install | sh`}</Block>
                            </div>
                            <div>
                                <H3>npm / npx (no install)</H3>
                                <Block>{`$ npx emitsignal listen alerts/prod
# or install globally
$ npm install -g emitsignal`}</Block>
                            </div>
                            <div>
                                <H3>Direct binary (GitHub Releases)</H3>
                                <Block>{`# macOS (arm64)
$ curl -Lo emitsignal https://github.com/kevenleone/emitsignal/cli/releases/latest/download/emitsignal-darwin-arm64
$ chmod +x emitsignal && sudo mv emitsignal /usr/local/bin

# Linux (amd64)
$ curl -Lo emitsignal https://github.com/kevenleone/emitsignal/cli/releases/latest/download/emitsignal-linux-amd64
$ chmod +x emitsignal && sudo mv emitsignal /usr/local/bin`}</Block>
                            </div>
                            <div>
                                <H3>Windows (PowerShell)</H3>
                                <Block>{`> winget install emitsignal
# or
> scoop install emitsignal`}</Block>
                            </div>
                            <div>
                                <H3>Docker</H3>
                                <Block>{`$ docker run --rm ghcr.io/emitsignal/cli:latest listen alerts/prod`}</Block>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-line bg-elev px-5 py-4">
                            <p className="m-0 font-mono text-[11.5px] text-muted">
                                <span className="text-success">✓</span> Verify the install:{' '}
                                <span className="font-mono text-fg">emitsignal --version</span>
                                <span className="ml-3 text-dim">→ emitsignal 0.7.2</span>
                            </p>
                        </div>
                    </Section>

                    {/* Quick Start */}
                    <Section id="quickstart">
                        <Kicker>Quick Start</Kicker>
                        <H2>Publish your first signal in one line.</H2>
                        <P>No account required. The demo topic is open to everyone.</P>
                        <Block>{`# Send a signal (no account needed)
$ curl -d "hello from the CLI" emitsignal.com/me-tryout

# Or with the CLI
$ emitsignal publish me/tryout "hello from the CLI"

# Listen in another terminal
$ emitsignal listen me/tryout
→ connected · topic: me/tryout · anonymous
21:52:01 ● me/tryout  p2  hello from the CLI`}</Block>

                        <div className="mt-6">
                            <H3>Log in to unlock channels, routing, and history</H3>
                            <Block>{`$ emitsignal login
→ Opening browser for authentication…
→ Logged in as you@example.com

# Now publish to your own channels
$ emitsignal publish deploy/prod "v2.14.3 shipped" --priority 4

# Listen to everything above priority 3
$ emitsignal listen --priority ">=3"
→ connected · 6 channels match`}</Block>
                        </div>
                    </Section>

                    {/* Commands */}
                    <Section id="commands">
                        <Kicker>Command Reference</Kicker>
                        <H2>All commands.</H2>
                        <P>
                            Every command accepts{' '}
                            <code className="font-mono text-[13px] text-accent">--help</code> for
                            inline documentation.
                        </P>

                        <div className="rounded-xl border border-line">
                            <div className="border-b border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                Core
                            </div>
                            <div className="px-4">
                                <CommandRow
                                    args="<topic> <message>"
                                    desc="Publish a message to a topic. Reads from stdin if message is omitted. Exits 0 on delivery confirmation."
                                    name="publish"
                                />
                                <CommandRow
                                    args="[topic-pattern]"
                                    desc="Stream incoming signals to stdout. Supports glob patterns (alerts/*), regex (/errors\/.+/), and filter expressions."
                                    name="listen"
                                />
                                <CommandRow
                                    args=""
                                    desc="Launch the full-screen TUI inbox. Arrow keys to navigate, Enter to expand, d to dismiss, r to replay."
                                    name="tui"
                                />
                            </div>

                            <div className="border-b border-t border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                Auth & Config
                            </div>
                            <div className="px-4">
                                <CommandRow
                                    args=""
                                    desc="Authenticate via browser. Stores token in ~/.emitsignal/config.toml. Use --token to provide a key directly."
                                    name="login"
                                />
                                <CommandRow
                                    args=""
                                    desc="Remove the stored credentials for the current workspace."
                                    name="logout"
                                />
                                <CommandRow
                                    args=""
                                    desc="Print the currently authenticated user and workspace."
                                    name="whoami"
                                />
                                <CommandRow
                                    args="[key] [value]"
                                    desc="Read or write CLI configuration. Run with no args to print all current settings."
                                    name="config"
                                />
                            </div>

                            <div className="border-b border-t border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                Channels & Topics
                            </div>
                            <div className="px-4">
                                <CommandRow
                                    args="[ls | create | delete | edit]"
                                    desc="List, create, delete, or edit channels. Channels are named topic namespaces with routing rules attached."
                                    name="channels"
                                />
                                <CommandRow
                                    args="[ls | subscribe | unsubscribe]"
                                    desc="Manage topic subscriptions. subscribe adds a topic to your feed; unsubscribe removes it."
                                    name="topics"
                                />
                                <CommandRow
                                    args="[ls | create | revoke]"
                                    desc="Manage API keys. create outputs a new key once — store it. revoke invalidates a key immediately."
                                    name="keys"
                                />
                            </div>

                            <div className="border-b border-t border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                Utilities
                            </div>
                            <div className="px-4">
                                <CommandRow
                                    args="<cmd>"
                                    desc="Run a shell command and publish its exit status. Succeeds exit 0 signal on success, failure + stderr on non-zero."
                                    name="run"
                                />
                                <CommandRow
                                    args=""
                                    desc="Print the current CLI version and check for updates."
                                    name="version"
                                />
                                <CommandRow
                                    args=""
                                    desc="Print connectivity diagnostics: auth status, SSE latency, API reachability."
                                    name="doctor"
                                />
                                <CommandRow
                                    args=""
                                    desc="Print the last N signals received (default 20). Useful for reviewing recent activity without opening the TUI."
                                    name="history"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Flags */}
                    <Section id="flags">
                        <Kicker>Global Flags</Kicker>
                        <H2>Flags that apply to every command.</H2>

                        <div className="rounded-xl border border-line px-4">
                            <FlagRow
                                default="~/.emitsignal/config.toml"
                                desc="Path to the config file. Override to use a project-local config."
                                flag="--config <path>"
                            />
                            <FlagRow
                                desc="API key or token. Overrides stored credentials. Useful in CI: set EMITSIGNAL_TOKEN env var instead."
                                flag="--token <key>"
                            />
                            <FlagRow
                                default="https://api.emitsignal.com"
                                desc="Override the API base URL. Use for self-hosted instances or local dev."
                                flag="--api-url <url>"
                            />
                            <FlagRow
                                default="pretty"
                                desc="Output format. pretty (default), json, or ndjson. json/ndjson are machine-readable — great for piping to jq."
                                flag="--format <fmt>"
                            />
                            <FlagRow
                                desc="Suppress all non-error output. Exit codes still reflect success/failure."
                                flag="--quiet"
                            />
                            <FlagRow
                                desc="Print extra debug information including request/response payloads and SSE frames."
                                flag="--verbose"
                            />
                            <FlagRow
                                desc="Disable color output. Also set NO_COLOR=1 for subprocesses."
                                flag="--no-color"
                            />
                            <FlagRow desc="Print help for any command." flag="--help, -h" />
                        </div>
                    </Section>

                    {/* publish flags */}
                    <Section id="publish">
                        <Kicker>publish · flags</Kicker>
                        <H2>publish in detail.</H2>
                        <P>
                            Publish reads from stdin when no message argument is given, making it
                            trivially composable with shell pipelines.
                        </P>
                        <Block>{`# From a literal string
$ emitsignal publish deploy/prod "v2.14.3 shipped"

# From stdin (pipe)
$ echo "$(date) backup complete" | emitsignal publish cron/backup

# From a file
$ emitsignal publish alerts/prod < /tmp/alert.txt

# With metadata
$ emitsignal publish deploy/prod "v2.14.3 shipped" \\
    --priority 4 \\
    --tag deploy --tag production \\
    --title "Deployment succeeded"

# With confirmation wait
$ emitsignal publish alerts/prod "disk full on api-01" --priority 5 --wait`}</Block>

                        <div className="mt-5 rounded-xl border border-line px-4">
                            <FlagRow
                                default="3"
                                desc="Signal priority 1–5. 5 = critical (triggers all delivery channels). 1 = low (inbox only)."
                                flag="--priority, -p <1-5>"
                            />
                            <FlagRow
                                desc="Attach one or more tags. Repeatable: --tag deploy --tag prod. Used in routing rules."
                                flag="--tag <tag>"
                            />
                            <FlagRow
                                desc="Short title shown in push notifications. Defaults to first 80 chars of the message."
                                flag="--title <text>"
                            />
                            <FlagRow
                                desc="Structured metadata as JSON. Stored with the signal and available in webhooks."
                                flag="--meta <json>"
                            />
                            <FlagRow
                                desc="Wait for delivery confirmation before exiting. Exit code 1 if not delivered within timeout."
                                flag="--wait"
                            />
                            <FlagRow
                                default="10s"
                                desc="Timeout when --wait is set."
                                flag="--timeout <duration>"
                            />
                        </div>
                    </Section>

                    {/* listen flags */}
                    <Section id="listen">
                        <Kicker>listen · flags</Kicker>
                        <H2>listen in detail.</H2>
                        <P>
                            listen opens an SSE connection and streams signals to stdout as they
                            arrive. It stays connected indefinitely; use Ctrl-C to stop.
                        </P>
                        <Block>{`# Listen to one topic
$ emitsignal listen deploy/prod

# Glob — all subtopics under alerts
$ emitsignal listen "alerts/*"

# Multiple topics
$ emitsignal listen deploy/prod alerts/prod cron/backup

# Filter by priority
$ emitsignal listen --priority ">=4"

# Filter by tag
$ emitsignal listen --tag deploy --tag production

# JSON output — pipe to jq
$ emitsignal listen --format json | jq -r '.title'

# Replay last 50 signals then stream live
$ emitsignal listen deploy/prod --replay 50

# Stop after receiving 1 signal (useful in scripts)
$ emitsignal listen deploy/prod --count 1`}</Block>

                        <div className="mt-5 rounded-xl border border-line px-4">
                            <FlagRow
                                desc="Filter expression. Supports >=, <=, =, AND, OR: --priority '>=3 AND <=5'."
                                flag="--priority <expr>"
                            />
                            <FlagRow
                                desc="Only show signals with this tag. Repeatable."
                                flag="--tag <tag>"
                            />
                            <FlagRow
                                default="pretty"
                                desc="Output format: pretty, json, ndjson, or tsv."
                                flag="--format <fmt>"
                            />
                            <FlagRow
                                desc="Replay the last N signals before streaming live."
                                flag="--replay <n>"
                            />
                            <FlagRow desc="Exit after receiving N signals." flag="--count <n>" />
                            <FlagRow
                                desc="Only show signals since this time. Accepts RFC3339 or relative: '10m', '2h', '1d'."
                                flag="--since <time>"
                            />
                        </div>
                    </Section>

                    {/* run command */}
                    <Section id="run">
                        <Kicker>run</Kicker>
                        <H2>Wrap any command and signal its outcome.</H2>
                        <P>
                            <code className="font-mono text-[13px] text-accent">
                                emitsignal run
                            </code>{' '}
                            executes a shell command and automatically publishes a success or
                            failure signal when it exits. Ideal for cron jobs and scripts.
                        </P>
                        <Block>{`# Basic usage — publishes to cron/<name> by default
$ emitsignal run --name "nightly-backup" pg_dump prod | gzip > /tmp/bak.gz

# Explicit topic
$ emitsignal run --topic cron/backup -- pg_dump prod | gzip > /tmp/bak.gz

# Capture stdout in the signal message
$ emitsignal run --capture-output --topic ci/tests -- npm test

# In a crontab
0 3 * * * emitsignal run --topic cron/backup -- /usr/local/bin/backup.sh

# Success output example:
✓ cron/backup  p3  nightly-backup succeeded · 0.41s
✗ cron/backup  p4  nightly-backup failed · exit 1 · "pg_dump: connection refused"`}</Block>

                        <div className="mt-5 rounded-xl border border-line px-4">
                            <FlagRow
                                desc="Human-readable name for the signal. Used as the signal title."
                                flag="--name <name>"
                            />
                            <FlagRow
                                desc="Topic to publish to. Defaults to cron/<name>."
                                flag="--topic <topic>"
                            />
                            <FlagRow
                                default="3"
                                desc="Priority on success."
                                flag="--priority-ok <1-5>"
                            />
                            <FlagRow
                                default="4"
                                desc="Priority on failure."
                                flag="--priority-fail <1-5>"
                            />
                            <FlagRow
                                desc="Include the last 500 chars of stdout/stderr in the signal message."
                                flag="--capture-output"
                            />
                            <FlagRow
                                desc="Only publish on failure. Silent on success."
                                flag="--only-failures"
                            />
                        </div>
                    </Section>

                    {/* Config file */}
                    <Section id="config">
                        <Kicker>Configuration</Kicker>
                        <H2>Config file reference.</H2>
                        <P>
                            The CLI stores its config in{' '}
                            <code className="font-mono text-[13px] text-accent">
                                ~/.emitsignal/config.toml
                            </code>
                            . You can also use a project-local file by passing{' '}
                            <code className="font-mono text-[13px] text-accent">
                                --config ./emitsignal.toml
                            </code>
                            .
                        </P>
                        <Block>{`# ~/.emitsignal/config.toml

[auth]
token = "es_live_xxxxxxxxxxxxxxxx"
workspace = "acme"

[api]
url = "https://api.emitsignal.com"   # override for self-hosted
timeout = "10s"

[output]
format = "pretty"    # pretty | json | ndjson
color = true
timestamps = true

[defaults]
priority = 3
wait = false

[tui]
# Keybindings (vim-style by default)
keybindings = "vim"    # vim | emacs | default
compact = false        # Compact list view

[run]
# Default topic pattern for emitsignal run
topic_pattern = "cron/{name}"
capture_output = false
only_failures = false`}</Block>
                    </Section>

                    {/* Environment variables */}
                    <Section id="env">
                        <Kicker>Environment Variables</Kicker>
                        <H2>Configure via environment.</H2>
                        <P>
                            All config keys have env var equivalents, prefixed with{' '}
                            <code className="font-mono text-[13px] text-accent">EMITSIGNAL_</code>.
                            Environment variables override the config file. Useful for CI and
                            Docker.
                        </P>

                        <div className="rounded-xl border border-line px-4">
                            <FlagRow
                                desc="API token. Overrides config file auth.token."
                                flag="EMITSIGNAL_TOKEN"
                            />
                            <FlagRow
                                desc="API base URL. Useful for self-hosted instances."
                                flag="EMITSIGNAL_API_URL"
                            />
                            <FlagRow
                                desc="Output format. pretty, json, or ndjson."
                                flag="EMITSIGNAL_FORMAT"
                            />
                            <FlagRow
                                desc="Default priority for publish commands."
                                flag="EMITSIGNAL_PRIORITY"
                            />
                            <FlagRow desc="Path to config file." flag="EMITSIGNAL_CONFIG" />
                            <FlagRow desc="Set to 1 to disable color output." flag="NO_COLOR" />
                        </div>

                        <div className="mt-5">
                            <H3>CI usage example (GitHub Actions)</H3>
                            <Block>{`# .github/workflows/deploy.yml
- name: Notify on deploy
  env:
    EMITSIGNAL_TOKEN: \${{ secrets.EMITSIGNAL_TOKEN }}
  run: |
    emitsignal publish deploy/prod "\\$GITHUB_REF_NAME shipped" --priority 4`}</Block>
                        </div>
                    </Section>

                    {/* TUI */}
                    <Section id="tui">
                        <Kicker>TUI</Kicker>
                        <H2>Full-screen terminal inbox.</H2>
                        <P>
                            The TUI is a full-featured terminal UI for reading and managing signals.
                            It streams live updates over SSE and shows your full inbox with
                            priorities, channels, and message detail.
                        </P>
                        <Block>{`$ emitsignal tui`}</Block>
                        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-deep font-mono text-[12px]">
                            <div className="border-b border-line px-3 py-2 text-dim">
                                EmitSignal TUI · v0.7.2 · you@example.com · 3 unread
                            </div>
                            <div className="grid grid-cols-[220px_1fr]">
                                <div className="border-r border-line p-2.5">
                                    <div className="rounded bg-accent/15 px-2 py-1 text-accent">
                                        ● Inbox (3)
                                    </div>
                                    <div className="mt-1 px-2 py-1 text-muted">● Channels</div>
                                    <div className="mt-1 px-2 py-1 text-muted">● Publish</div>
                                    <div className="mt-3 px-2 text-[10px] uppercase tracking-widest text-faint">
                                        Channels
                                    </div>
                                    <div className="mt-1 px-2 py-0.5 text-muted"> alerts/prod</div>
                                    <div className="px-2 py-0.5 text-muted"> deploy/prod</div>
                                    <div className="px-2 py-0.5 text-muted"> cron/backup</div>
                                </div>
                                <div className="p-2.5">
                                    <div className="flex items-center gap-2 rounded bg-elev px-2.5 py-2">
                                        <span className="text-danger">●</span>
                                        <span className="flex-1 text-fg">
                                            High memory on api-02
                                        </span>
                                        <span className="text-faint">2m · p5</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 px-2.5 py-2">
                                        <span className="text-accent">●</span>
                                        <span className="flex-1 text-muted">v2.14.3 shipped</span>
                                        <span className="text-faint">4m · p4</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 px-2.5 py-2">
                                        <span className="text-success">●</span>
                                        <span className="flex-1 text-muted">
                                            Build passed · 247 tests
                                        </span>
                                        <span className="text-faint">12m · p3</span>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-line px-3 py-1.5 text-[10px] text-faint">
                                j/k navigate · Enter expand · d dismiss · / filter · q quit
                            </div>
                        </div>

                        <div className="mt-5">
                            <H3>Keybindings</H3>
                            <div className="rounded-xl border border-line px-4">
                                <FlagRow
                                    desc="Move up / down through the list."
                                    flag="j / k  or  ↑ / ↓"
                                />
                                <FlagRow
                                    desc="Expand the selected signal to full detail."
                                    flag="Enter"
                                />
                                <FlagRow
                                    desc="Dismiss (mark as read) the selected signal."
                                    flag="d"
                                />
                                <FlagRow desc="Dismiss all signals in the current view." flag="D" />
                                <FlagRow
                                    desc="Open the filter bar. Type a topic glob or priority expression."
                                    flag="/"
                                />
                                <FlagRow desc="Open the publish dialog." flag="p" />
                                <FlagRow
                                    desc="Replay the selected signal (re-deliver to all subscribers)."
                                    flag="r"
                                />
                                <FlagRow desc="Go to previous screen." flag="Esc / q" />
                            </div>
                        </div>
                    </Section>

                    {/* Shell recipes */}
                    <Section id="recipes">
                        <Kicker>Recipes</Kicker>
                        <H2>Shell one-liners and patterns.</H2>

                        <div className="space-y-4">
                            {[
                                {
                                    code: `$ tail -f /var/log/app.log | grep --line-buffered "error" \\
    | while read -r line; do
        emitsignal publish alerts/prod "$line" --priority 4
    done`,
                                    desc: 'Alert when a log file mentions "error"',
                                },
                                {
                                    code: `$ make build && emitsignal publish me/build "build succeeded" \\
    || emitsignal publish me/build "build failed" --priority 4`,
                                    desc: 'Notify when a long-running command finishes',
                                },
                                {
                                    code: `# crontab -e
0 3 * * * emitsignal run --topic cron/backup -- /usr/local/bin/nightly-backup.sh`,
                                    desc: 'Wrap a cron job and signal success/failure',
                                },
                                {
                                    code: `$ emitsignal listen deploy/staging --count 1 --format json \\
    | jq -r '.message' > /tmp/deploy-status.txt
$ cat /tmp/deploy-status.txt`,
                                    desc: 'Wait for a signal before continuing (useful in scripts)',
                                },
                                {
                                    code: `import requests
requests.post("https://api.emitsignal.com/publish/deploy/prod",
    json={"message": "v2.0.1 shipped", "priority": 4},
    headers={"Authorization": "Bearer es_live_xxx"})`,
                                    desc: 'Publish from Python (no SDK)',
                                },
                                {
                                    code: `- run: emitsignal publish deploy/\${{ github.ref_name }} "shipped" -p4
  env:
    EMITSIGNAL_TOKEN: \${{ secrets.EMITSIGNAL_TOKEN }}`,
                                    desc: 'GitHub Actions — notify on deploy',
                                },
                            ].map(({ code, desc }) => (
                                <div key={desc}>
                                    <p className="mb-1.5 font-mono text-[12px] text-muted">
                                        # {desc}
                                    </p>
                                    <Block>{code}</Block>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Updates */}
                    <Section id="updates">
                        <Kicker>Updates</Kicker>
                        <H2>Staying up to date.</H2>
                        <Block>{`# Homebrew
$ brew upgrade emitsignal

# Shell installer (re-runs the install script, keeps your config)
$ curl -sSL https://emitsignal.com/install | sh

# npm
$ npm update -g emitsignal

# Check current version
$ emitsignal version
emitsignal 0.7.2 (latest)`}</Block>
                        <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-3.5 font-mono text-[12px] text-muted">
                            <span className="text-accent">→</span> The CLI checks for updates once
                            per day and prints a notice when one is available. Disable with{' '}
                            <span className="text-fg">EMITSIGNAL_NO_UPDATE_CHECK=1</span>.
                        </div>
                    </Section>

                    <div className="border-t border-line py-12 text-center">
                        <p className="mb-4 text-[14px] text-muted">
                            Something missing? Open an issue or send a signal.
                        </p>
                        <Link
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[13px] font-semibold text-bg no-underline hover:bg-accent-dim"
                            to="/api"
                        >
                            Explore the API →
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Block({ children }: { children: React.ReactNode }) {
    return (
        <pre className="overflow-x-auto rounded-xl border border-line bg-deep px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-fg">
            {children}
        </pre>
    );
}

function CommandRow({ args, desc, name }: { args?: string; desc: string; name: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-line py-3.5 sm:flex-row sm:items-start sm:gap-6">
            <div className="min-w-0 shrink-0 sm:w-[280px]">
                <span className="font-mono text-[12.5px] text-accent">{name}</span>
                {args && <span className="ml-1.5 font-mono text-[11.5px] text-dim">{args}</span>}
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-muted">{desc}</p>
        </div>
    );
}

function FlagRow({ default: def, desc, flag }: { default?: string; desc: string; flag: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-start sm:gap-6">
            <div className="shrink-0 sm:w-[240px]">
                <span className="font-mono text-[12px] text-warn">{flag}</span>
                {def && (
                    <span className="ml-2 font-mono text-[10.5px] text-faint">default: {def}</span>
                )}
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-muted">{desc}</p>
        </div>
    );
}

function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 mt-0 text-[26px] font-semibold tracking-[-0.6px] text-fg">
            {children}
        </h2>
    );
}

function H3({ children }: { children: React.ReactNode }) {
    return <h3 className="mb-2 mt-0 font-mono text-[15px] font-semibold text-fg">{children}</h3>;
}

function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
            {children}
        </p>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-[14px] leading-[1.65] text-muted">{children}</p>;
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <section className="border-t border-line py-14" id={id}>
            {children}
        </section>
    );
}
