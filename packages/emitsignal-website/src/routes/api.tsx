import { createFileRoute, Link } from '@tanstack/react-router';

import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';

export const Route = createFileRoute('/api')({ component: APIPage });

export default function APIPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <SiteNav variant="pinned">
                <SiteNavWordmark />
            </SiteNav>

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[860px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                        REST API · v1 · JSON
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        API Reference
                    </h1>
                    <p className="mb-8 max-w-[600px] text-[18px] leading-[1.6] text-muted">
                        A simple HTTP API. No SDK required. If it can make an HTTP request, it can
                        publish a signal. Curl works. Every language works.
                    </p>
                    <Block>{`# Base URL
https://api.emitsignal.com

# Publish a signal — no account needed on /welcome
$ curl -d "hello" https://api.emitsignal.com/welcome

# Authenticated publish
$ curl https://api.emitsignal.com/publish/deploy/prod \\
  -H "Authorization: Bearer es_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "v2.14.3 shipped", "priority": 4}'`}</Block>
                </div>
            </div>

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[860px]">
                    {/* Auth */}
                    <Section id="auth">
                        <Kicker>Authentication</Kicker>
                        <H2>Bearer token authentication.</H2>
                        <P>
                            Include your API key in the{' '}
                            <code className="font-mono text-[13px] text-accent">Authorization</code>{' '}
                            header. Keys are prefixed with{' '}
                            <code className="font-mono text-[13px] text-accent">es_</code> for
                            production and{' '}
                            <code className="font-mono text-[13px] text-accent">es_test_</code> for
                            test/sandbox environments.
                        </P>
                        <Block>{`# In a request header
Authorization: Bearer es_xxxxxxxxxxxxxxxxxxxxxxxx

# Or via query param (not recommended for production)
?token=es_xxxxxxxxxxxxxxxxxxxxxxxx`}</Block>

                        <div className="mt-5 rounded-xl border border-line bg-elev px-5 py-4">
                            <p className="m-0 font-mono text-[12px] text-muted">
                                <span className="text-warn">⚠</span> Keys have scopes:{' '}
                                <span className="text-accent">publish</span>,{' '}
                                <span className="text-accent">subscribe</span>,{' '}
                                <span className="text-accent">admin</span>. Create scoped keys per
                                service to limit blast radius.{' '}
                                <Link className="text-accent no-underline" to="/dashboard">
                                    Manage keys →
                                </Link>
                            </p>
                        </div>

                        <div className="mt-5">
                            <H3>Unauthenticated access</H3>
                            <P>
                                A handful of endpoints work without auth — primarily the{' '}
                                <code className="font-mono text-[13px] text-accent">/welcome</code>{' '}
                                demo topic and anonymous device registration. All other endpoints
                                require a valid token.
                            </P>
                        </div>
                    </Section>

                    {/* Publish */}
                    <Section id="publish">
                        <Kicker>Publish</Kicker>
                        <H2>Send a signal to a topic.</H2>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="Publish a signal to a topic. Creates the topic if it doesn't exist."
                                method="POST"
                                path="/publish/:topic"
                            />
                            <Endpoint
                                desc="Publish a signal to the public demo topic. No auth required."
                                method="POST"
                                path="/:topic"
                            />
                        </div>

                        <H3>Request body</H3>
                        <Block>{`{
  "message": "string",          // required — the signal body (max 64 KB)
  "title":   "string",          // optional — shown in push notifications
  "priority": 1-5,              // optional, default 3
  "tags":    ["string"],        // optional — used in routing rules
  "meta":    { ... },           // optional — arbitrary JSON metadata
  "idempotency_key": "string"   // optional — deduplicate within 24h
}`}</Block>

                        <div className="mt-4">
                            <H3>Plaintext shorthand</H3>
                            <P>
                                Set{' '}
                                <code className="font-mono text-[13px] text-accent">
                                    Content-Type: text/plain
                                </code>{' '}
                                to publish with just the body as the message. This is what curl -d
                                uses by default.
                            </P>
                            <Block>{`$ curl -d "disk full on api-01" \\
  -H "Authorization: Bearer es_xxx" \\
  https://api.emitsignal.com/publish/alerts/prod`}</Block>
                        </div>

                        <div className="mt-4">
                            <H3>Response</H3>
                            <Block>{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "sig_01j9xz3p4q5r6s7t8u9v0w1x2y",
  "topic": "deploy/prod",
  "delivered_at": "2026-05-28T21:52:01Z",
  "subscriber_count": 3,
  "status": "delivered"
}`}</Block>
                        </div>

                        <div className="mt-4">
                            <H3>Priority semantics</H3>
                            <div className="rounded-xl border border-line">
                                {[
                                    {
                                        desc: 'Push + SMS + Slack + email. Wakes you up.',
                                        label: 'critical',
                                        p: 5,
                                    },
                                    {
                                        desc: 'Push + Slack. Important but not an emergency.',
                                        label: 'high',
                                        p: 4,
                                    },
                                    {
                                        desc: 'Push only (default). Most signals live here.',
                                        label: 'normal',
                                        p: 3,
                                    },
                                    { desc: 'Inbox only. No push.', label: 'low', p: 2 },
                                    {
                                        desc: 'Inbox only. Suppressed unless explicitly subscribed.',
                                        label: 'debug',
                                        p: 1,
                                    },
                                ].map(({ desc, label, p }) => (
                                    <div
                                        className="flex items-start gap-4 border-b border-line px-4 py-3 last:border-0"
                                        key={p}
                                    >
                                        <span className="w-4 font-mono text-[13px] text-accent">
                                            p{p}
                                        </span>
                                        <span className="w-16 font-mono text-[12px] text-dim">
                                            {label}
                                        </span>
                                        <span className="text-[13px] text-muted">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Subscribe */}
                    <Section id="subscribe">
                        <Kicker>Subscribe</Kicker>
                        <H2>Stream signals with SSE.</H2>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="Open a Server-Sent Events stream. Delivers signals in real time as they are published."
                                method="GET"
                                path="/subscribe/:topic"
                            />
                            <Endpoint
                                auth
                                desc="Subscribe to multiple topics with a comma-separated list or glob pattern."
                                method="GET"
                                path="/subscribe?topics=alerts/*,deploy/prod"
                            />
                        </div>

                        <Block>{`$ curl -N \\
  -H "Authorization: Bearer es_xxx" \\
  "https://api.emitsignal.com/subscribe/alerts/prod"

# SSE stream output:
data: {"id":"sig_xxx","topic":"alerts/prod","message":"High memory","priority":5,"timestamp":"2026-05-28T21:52:14Z"}

data: {"id":"sig_yyy","topic":"alerts/prod","message":"TLS cert expiring","priority":5,"timestamp":"2026-05-28T22:05:32Z"}`}</Block>

                        <div className="mt-4">
                            <H3>Query parameters</H3>
                            <div className="rounded-xl border border-line px-4">
                                {[
                                    {
                                        desc: 'Filter expression. E.g. priority=>=3',
                                        flag: 'priority',
                                    },
                                    {
                                        desc: 'Filter by tag. Repeatable: tag=deploy&tag=prod',
                                        flag: 'tag',
                                    },
                                    {
                                        desc: 'Replay last N signals before streaming live.',
                                        flag: 'replay',
                                    },
                                    {
                                        desc: 'ISO 8601 timestamp. Only stream signals after this time.',
                                        flag: 'since',
                                    },
                                    { desc: 'json (default) or ndjson.', flag: 'format' },
                                ].map(({ desc, flag }) => (
                                    <div
                                        className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-6"
                                        key={flag}
                                    >
                                        <span className="w-24 shrink-0 font-mono text-[12px] text-warn">
                                            {flag}
                                        </span>
                                        <span className="text-[13px] text-muted">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Topics */}
                    <Section id="topics">
                        <Kicker>Topics</Kicker>
                        <H2>Topic management.</H2>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="List all topics the authenticated user has access to."
                                method="GET"
                                path="/topics"
                            />
                            <Endpoint
                                auth
                                desc="Get metadata and recent signal stats for a topic."
                                method="GET"
                                path="/topics/:topic"
                            />
                            <Endpoint
                                auth
                                desc="Create or update a topic with routing rules."
                                method="PUT"
                                path="/topics/:topic"
                            />
                            <Endpoint
                                auth
                                desc="Delete a topic and all its signals."
                                method="DELETE"
                                path="/topics/:topic"
                            />
                            <Endpoint
                                auth
                                desc="Get recent signals for a topic."
                                method="GET"
                                path="/topics/:topic/signals"
                            />
                        </div>

                        <H3>Topic naming rules</H3>
                        <Block>{`# Topics are slash-delimited strings
deploy/prod
alerts/prod
cron/nightly-backup
github/acme/pr-reviews

# Rules:
# - Lowercase letters, numbers, hyphens, underscores, slashes
# - Max 5 segments, max 128 chars total
# - No leading/trailing slashes
# - Wildcards only in subscribe patterns (alerts/*), not in publish

# Examples of valid topics
alerts/prod
deploy/api-gateway
me/personal
sensors/home/garage-door
ci/web-app/main`}</Block>
                    </Section>

                    {/* Channels */}
                    <Section id="channels">
                        <Kicker>Channels</Kicker>
                        <H2>Channel management.</H2>
                        <P>
                            Channels are named namespaces that group topics and attach routing
                            rules. They map to a topic prefix — all topics under{' '}
                            <code className="font-mono text-[13px] text-accent">deploy/</code>{' '}
                            belong to the{' '}
                            <code className="font-mono text-[13px] text-accent">deploy</code>{' '}
                            channel.
                        </P>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="List all channels."
                                method="GET"
                                path="/channels"
                            />
                            <Endpoint
                                auth
                                desc="Get a channel and its routing rules."
                                method="GET"
                                path="/channels/:id"
                            />
                            <Endpoint
                                auth
                                desc="Create a channel."
                                method="POST"
                                path="/channels"
                            />
                            <Endpoint
                                auth
                                desc="Update a channel's settings and routing rules."
                                method="PUT"
                                path="/channels/:id"
                            />
                            <Endpoint
                                auth
                                desc="Delete a channel."
                                method="DELETE"
                                path="/channels/:id"
                            />
                        </div>

                        <H3>Channel object</H3>
                        <Block>{`{
  "id":          "ch_01j9xz3p4q5r6s7t8u9",
  "name":        "deploy",
  "topic_prefix": "deploy/",
  "description": "Production deployments",
  "routing_rules": [
    { "match": "priority:>=4",    "deliver": ["push", "slack"] },
    { "match": "priority:<=3",    "deliver": ["inbox"] },
    { "match": "tag:rollback",    "deliver": ["push", "sms", "slack"], "priority_override": 5 },
    { "match": "hour:between(0,7)", "deliver": ["inbox"], "batch": true }
  ],
  "created_at": "2026-01-15T09:00:00Z",
  "signal_count_30d": 14820
}`}</Block>
                    </Section>

                    {/* Signals */}
                    <Section id="signals">
                        <Kicker>Signals</Kicker>
                        <H2>Signal history and management.</H2>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="List received signals. Filterable by topic, priority, tag, and date range."
                                method="GET"
                                path="/signals"
                            />
                            <Endpoint
                                auth
                                desc="Get a single signal by ID."
                                method="GET"
                                path="/signals/:id"
                            />
                            <Endpoint
                                auth
                                desc="Mark a signal as read."
                                method="POST"
                                path="/signals/:id/read"
                            />
                            <Endpoint
                                auth
                                desc="Mark all signals as read."
                                method="POST"
                                path="/signals/read-all"
                            />
                            <Endpoint
                                auth
                                desc="Delete a signal from your inbox."
                                method="DELETE"
                                path="/signals/:id"
                            />
                            <Endpoint
                                auth
                                desc="Replay a signal — re-deliver to all current subscribers."
                                method="POST"
                                path="/signals/:id/replay"
                            />
                        </div>

                        <H3>Signal object</H3>
                        <Block>{`{
  "id":           "sig_01j9xz3p4q5r6s7t8u9v0w1x2y",
  "topic":        "deploy/prod",
  "title":        "v2.14.3 shipped",
  "message":      "api-gateway deployed successfully · 1m 42s",
  "priority":     4,
  "tags":         ["deploy", "production"],
  "meta":         { "commit": "a3f82bc", "duration_s": 102 },
  "read":         false,
  "published_at": "2026-05-28T21:52:01Z",
  "publisher": {
    "type":  "api_key",
    "label": "ci-prod"
  }
}`}</Block>

                        <H3>List query parameters</H3>
                        <div className="mt-2 rounded-xl border border-line px-4">
                            {[
                                {
                                    desc: 'Filter by topic (exact or glob: deploy/*).',
                                    flag: 'topic',
                                },
                                { desc: 'Filter expression: >=3, =5, 1-3.', flag: 'priority' },
                                { desc: 'Filter by tag. Repeatable.', flag: 'tag' },
                                { desc: 'true or false — filter by read status.', flag: 'read' },
                                { desc: 'ISO 8601 date range.', flag: 'since / until' },
                                { desc: 'Page size, default 50, max 500.', flag: 'limit' },
                                {
                                    desc: 'Pagination cursor from previous response.',
                                    flag: 'cursor',
                                },
                            ].map(({ desc, flag }) => (
                                <div
                                    className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-6"
                                    key={flag}
                                >
                                    <span className="w-32 shrink-0 font-mono text-[12px] text-warn">
                                        {flag}
                                    </span>
                                    <span className="text-[13px] text-muted">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Keys */}
                    <Section id="keys">
                        <Kicker>API Keys</Kicker>
                        <H2>Key management.</H2>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint
                                auth
                                desc="List all API keys for the workspace."
                                method="GET"
                                path="/keys"
                            />
                            <Endpoint
                                auth
                                desc="Create a new API key. The secret is only shown once in the response."
                                method="POST"
                                path="/keys"
                            />
                            <Endpoint
                                auth
                                desc="Get key metadata (never returns the secret)."
                                method="GET"
                                path="/keys/:id"
                            />
                            <Endpoint
                                auth
                                desc="Revoke a key immediately. All requests using it fail from this moment on."
                                method="DELETE"
                                path="/keys/:id"
                            />
                        </div>

                        <H3>Create key request</H3>
                        <Block>{`POST /keys
{
  "label":  "ci-prod",
  "scopes": ["publish"],        // publish | subscribe | admin
  "topics": ["deploy/*", "ci/*"],  // optional — restrict to specific topics
  "expires_at": "2027-01-01T00:00:00Z"  // optional
}

// Response — secret shown only once
{
  "id":         "key_01j9xz3p4q5r",
  "label":      "ci-prod",
  "secret":     "es_xxxxxxxxxxxxxxxxxxxxxxxx",
  "scopes":     ["publish"],
  "created_at": "2026-05-28T09:00:00Z"
}`}</Block>
                    </Section>

                    {/* Webhooks */}
                    <Section id="webhooks">
                        <Kicker>Webhooks</Kicker>
                        <H2>Deliver signals to your HTTP endpoint.</H2>
                        <P>
                            Register a webhook endpoint and EmitSignal will POST a JSON payload to
                            it for every matching signal. Useful for integrating with Slack,
                            PagerDuty, or your own services.
                        </P>

                        <div className="mb-5 rounded-xl border border-line">
                            <Endpoint auth desc="List webhooks." method="GET" path="/webhooks" />
                            <Endpoint
                                auth
                                desc="Create a webhook."
                                method="POST"
                                path="/webhooks"
                            />
                            <Endpoint
                                auth
                                desc="Update a webhook."
                                method="PUT"
                                path="/webhooks/:id"
                            />
                            <Endpoint
                                auth
                                desc="Delete a webhook."
                                method="DELETE"
                                path="/webhooks/:id"
                            />
                            <Endpoint
                                auth
                                desc="List recent deliveries for a webhook."
                                method="GET"
                                path="/webhooks/:id/deliveries"
                            />
                            <Endpoint
                                auth
                                desc="Replay a failed delivery."
                                method="POST"
                                path="/webhooks/:id/deliveries/:delivery_id/replay"
                            />
                        </div>

                        <H3>Webhook payload</H3>
                        <Block>{`POST https://your-server.example.com/emitsignal-hook
Content-Type: application/json
X-EmitSignal-Signature: sha256=xxxxxxxxxxxxxxxx
X-EmitSignal-Delivery: del_01j9xz3p4q5r

{
  "event": "signal.published",
  "signal": {
    "id":       "sig_01j9xz3p4q5r6s7t8u9v0w1x2y",
    "topic":    "deploy/prod",
    "title":    "v2.14.3 shipped",
    "message":  "api-gateway deployed · 1m 42s",
    "priority": 4,
    "tags":     ["deploy", "production"],
    "published_at": "2026-05-28T21:52:01Z"
  }
}`}</Block>

                        <div className="mt-4">
                            <H3>Signature verification</H3>
                            <Block>{`// Node.js
import crypto from 'crypto'

function verifySignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )
}`}</Block>
                        </div>
                    </Section>

                    {/* Errors */}
                    <Section id="errors">
                        <Kicker>Errors</Kicker>
                        <H2>Error responses.</H2>
                        <P>
                            All errors return JSON with a consistent shape. HTTP status codes follow
                            standard conventions.
                        </P>
                        <Block>{`{
  "error": {
    "code":    "topic_not_found",
    "message": "Topic 'deploy/staging' does not exist",
    "status":  404
  }
}`}</Block>

                        <div className="mt-4 rounded-xl border border-line">
                            {[
                                {
                                    code: '400',
                                    desc: 'Invalid request body or missing required fields.',
                                    label: 'bad_request',
                                },
                                {
                                    code: '401',
                                    desc: 'Missing or invalid Authorization header.',
                                    label: 'unauthorized',
                                },
                                {
                                    code: '403',
                                    desc: 'Valid token but insufficient scope or topic access.',
                                    label: 'forbidden',
                                },
                                {
                                    code: '404',
                                    desc: 'Topic, signal, or resource does not exist.',
                                    label: 'not_found',
                                },
                                {
                                    code: '409',
                                    desc: 'Duplicate idempotency_key within 24h window.',
                                    label: 'conflict',
                                },
                                {
                                    code: '422',
                                    desc: 'Request is well-formed but semantically invalid.',
                                    label: 'unprocessable',
                                },
                                {
                                    code: '429',
                                    desc: 'Too many requests. See Retry-After header.',
                                    label: 'rate_limited',
                                },
                                {
                                    code: '500',
                                    desc: 'Something went wrong on our end. Report it.',
                                    label: 'internal_error',
                                },
                            ].map(({ code, desc, label }) => (
                                <div
                                    className="flex items-start gap-4 border-b border-line px-4 py-3 last:border-0"
                                    key={code}
                                >
                                    <span className="w-8 font-mono text-[13px] text-dim">
                                        {code}
                                    </span>
                                    <span className="w-36 shrink-0 font-mono text-[12px] text-warn">
                                        {label}
                                    </span>
                                    <span className="text-[13px] text-muted">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Rate limits */}
                    <Section id="rate-limits">
                        <Kicker>Rate Limits</Kicker>
                        <H2>Limits and quotas.</H2>

                        <div className="rounded-xl border border-line">
                            {[
                                {
                                    publish: '10 req/s',
                                    signals: '10k/mo',
                                    subscribe: '5 concurrent',
                                    tier: 'Free',
                                },
                                {
                                    publish: '100 req/s',
                                    signals: '1M/user/mo',
                                    subscribe: '50 concurrent',
                                    tier: 'Team',
                                },
                                {
                                    publish: 'custom',
                                    signals: 'unlimited',
                                    subscribe: 'unlimited',
                                    tier: 'Enterprise',
                                },
                            ].map((row) => (
                                <div
                                    className="grid grid-cols-4 items-center gap-4 border-b border-line px-4 py-3 last:border-0"
                                    key={row.tier}
                                >
                                    <span className="font-mono text-[12px] text-accent">
                                        {row.tier}
                                    </span>
                                    <span className="text-[12px] text-muted">{row.publish}</span>
                                    <span className="text-[12px] text-muted">{row.subscribe}</span>
                                    <span className="text-[12px] text-muted">{row.signals}</span>
                                </div>
                            ))}
                        </div>

                        <P>
                            Rate limit headers are included in every response:{' '}
                            <code className="font-mono text-[13px] text-accent">
                                X-RateLimit-Limit
                            </code>
                            ,{' '}
                            <code className="font-mono text-[13px] text-accent">
                                X-RateLimit-Remaining
                            </code>
                            ,{' '}
                            <code className="font-mono text-[13px] text-accent">
                                X-RateLimit-Reset
                            </code>
                            . When limited, you receive a{' '}
                            <code className="font-mono text-[13px] text-warn">429</code> with a{' '}
                            <code className="font-mono text-[13px] text-accent">Retry-After</code>{' '}
                            header.
                        </P>
                    </Section>

                    <div className="border-t border-line py-12 text-center">
                        <p className="mb-4 text-[14px] text-muted">
                            Ready to start? Grab a key from the dashboard.
                        </p>
                        <Link
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[13px] font-semibold text-bg no-underline hover:bg-accent-dim"
                            to="/app"
                        >
                            Open dashboard →
                        </Link>
                    </div>
                </div>
            </div>

            <SiteFooter />
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

function Endpoint({
    auth,
    desc,
    method,
    path,
}: {
    auth?: boolean;
    desc: string;
    method: string;
    path: string;
}) {
    return (
        <div className="border-b border-line py-4">
            <div className="mb-1 flex flex-wrap items-center gap-3">
                <Method method={method} />
                <code className="font-mono text-[13px] text-fg">{path}</code>
                {auth && (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        auth
                    </span>
                )}
            </div>
            <p className="m-0 text-[13px] leading-[1.5] text-muted">{desc}</p>
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

function Method({ method }: { method: string }) {
    const colors: Record<string, string> = {
        DELETE: 'text-danger',
        GET: 'text-success',
        POST: 'text-accent',
        PUT: 'text-warn',
    };
    return (
        <span className={`font-mono text-[11px] font-bold ${colors[method] ?? 'text-fg'}`}>
            {method}
        </span>
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
