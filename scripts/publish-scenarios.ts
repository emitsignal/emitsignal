// Scenario catalogue for POST /topic/:name.
//
// Every scenario mirrors a branch of packages/emitsignal-server/src/http/topic/publish.ts
// (and the header parser in src/lib/header-publish.ts). Add a scenario here and the
// runner in publish.ts picks it up automatically.

export type Outcome = 'error' | 'posted' | 'scheduled';

export interface Scenario {
    build: (context: ScenarioContext) => ScenarioRequest;
    description: string;
    // What the server is expected to answer. Note that a few publish failures
    // reply with HTTP 200 and an `error` field in the body — the runner treats
    // both shapes as the `error` outcome.
    expect: Outcome;
    group: ScenarioGroup;
    name: string;
}

export interface ScenarioContext {
    now: number;
    topic: string;
}

export type ScenarioGroup = 'errors' | 'headers' | 'json' | 'media' | 'schedule' | 'showcase';

export interface ScenarioRequest {
    body: string;
    headers: Record<string, string>;
    topic: string;
}

// Publicly reachable sample media. Anonymous publishers may attach a single
// item per array (ANON_INLINE_MAX), so the happy-path media scenarios stay at one.
const SAMPLE_ATTACHMENT = 'https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore';
const SAMPLE_BANNER = 'https://picsum.photos/id/1018/1200/400';
const SAMPLE_IMAGE = 'https://picsum.photos/id/1025/600/400';

const PRIORITY_LABELS: Record<number, string> = {
    1: 'min — silent, lowest severity',
    2: 'low',
    3: 'default',
    4: 'high',
    5: 'max — urgent/critical',
};

// Showcase media lives in the website's public/ folder, which production serves
// at the root. Point EMITSIGNAL_MEDIA_BASE at a local dev server (usually
// http://localhost:5002) before the assets have been deployed.
const MEDIA_BASE = (process.env.EMITSIGNAL_MEDIA_BASE ?? 'https://emitsignal.com').replace(
    /\/+$/,
    '',
);

function showcaseAsset(name: string): string {
    return `${MEDIA_BASE}/static/showcase/${name}`;
}

export const scenarios: Scenario[] = [
    // ---------------------------------------------------------------- json
    {
        build: ({ topic }) => jsonRequest(topic, { title: 'Title only signal' }),
        description: 'Title without a body — the minimum accepted payload',
        expect: 'posted',
        group: 'json',
        name: 'title-only',
    },
    {
        build: ({ topic }) => jsonRequest(topic, { body: 'Body only signal, no title.' }),
        description: 'Body without a title — the other minimum accepted payload',
        expect: 'posted',
        group: 'json',
        name: 'body-only',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'Disk usage crossed 90% on node-3.',
                title: 'Deploy finished',
            }),
        description: 'Standard title + body JSON publish',
        expect: 'posted',
        group: 'json',
        name: 'title-and-body',
    },
    ...buildPriorityScenarios(),
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'Tagged for routing and filtering.',
                tags: ['ci', 'deploy', 'production'],
                title: 'Tagged signal',
            }),
        description: 'tags array (max 20 entries, 64 chars each)',
        expect: 'posted',
        group: 'json',
        name: 'tags',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [
                    { label: 'Open dashboard', type: 'view', url: 'https://example.com/logs' },
                ],
                body: 'Tap through to the run that failed.',
                title: 'Build failed',
            }),
        description: 'Single view action with a tap-through URL',
        expect: 'posted',
        group: 'json',
        name: 'action-view',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [{ label: 'Got it', type: 'acknowledge' }],
                body: 'Requires a human to confirm receipt.',
                title: 'Pager alert',
            }),
        description: 'Single acknowledge action',
        expect: 'posted',
        group: 'json',
        name: 'action-acknowledge',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [
                    {
                        label: 'View incident',
                        type: 'view',
                        url: 'https://example.com/incident/42',
                    },
                    { label: 'Acknowledge', type: 'acknowledge' },
                ],
                body: 'Both action kinds on one message (the maximum of 2).',
                priority: 5,
                title: 'Incident opened',
            }),
        description: 'Two actions — view + acknowledge, the documented maximum',
        expect: 'posted',
        group: 'json',
        name: 'actions-view-and-acknowledge',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'line one\nline two\n\nline four after a blank line',
                title: 'Multiline body',
            }),
        description: 'Newlines survive the JSON body path',
        expect: 'posted',
        group: 'json',
        name: 'multiline-body',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'Unicode round-trip: ação, 日本語, emoji 🚀🔥',
                tags: ['ünïcode', '🚀'],
                title: '🚀 Unicode & emoji',
            }),
        description: 'Non-ASCII title, body and tags',
        expect: 'posted',
        group: 'json',
        name: 'unicode-and-emoji',
    },

    // --------------------------------------------------------------- media
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                bannerImage: SAMPLE_BANNER,
                title: 'Banner from a bare URL string',
            }),
        description: 'bannerImage as a plain URL string',
        expect: 'posted',
        group: 'media',
        name: 'banner-image-url',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                bannerImage: { href: SAMPLE_BANNER, title: 'Release banner' },
                title: 'Banner from a {href, title} object',
            }),
        description: 'bannerImage as a titled media reference',
        expect: 'posted',
        group: 'media',
        name: 'banner-image-object',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'One inline image (the anonymous per-array limit).',
                inlineImages: [SAMPLE_IMAGE],
                title: 'Inline image',
            }),
        description: 'inlineImages array with a single entry',
        expect: 'posted',
        group: 'media',
        name: 'inline-image',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                body: 'One inline attachment.',
                inlineAttachments: [{ href: SAMPLE_ATTACHMENT, title: 'Node.gitignore' }],
                title: 'Inline attachment',
            }),
        description: 'inlineAttachments array with a titled entry',
        expect: 'posted',
        group: 'media',
        name: 'inline-attachment',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [{ label: 'Release notes', type: 'view', url: 'https://example.com/v2' }],
                bannerImage: SAMPLE_BANNER,
                body: 'Banner, inline image, attachment, action, tags and priority in one payload.',
                inlineAttachments: [SAMPLE_ATTACHMENT],
                inlineImages: [SAMPLE_IMAGE],
                priority: 4,
                tags: ['release', 'v2'],
                title: 'Everything at once',
            }),
        description: 'Every optional field populated in a single publish',
        expect: 'posted',
        group: 'media',
        name: 'full-payload',
    },

    // ------------------------------------------------------------ schedule
    {
        build: ({ now, topic }) =>
            jsonRequest(topic, {
                body: 'Skips the SSE bus and goes to the schedule queue.',
                scheduledAt: now + 60,
                title: 'Scheduled in 60s',
            }),
        description: 'scheduledAt in the future — queued, not delivered now',
        expect: 'scheduled',
        group: 'schedule',
        name: 'scheduled-in-60-seconds',
    },
    {
        build: ({ now, topic }) =>
            jsonRequest(topic, {
                body: 'A past timestamp is not a schedule — this delivers immediately.',
                scheduledAt: now - 60,
                title: 'Scheduled in the past',
            }),
        description: 'scheduledAt <= now falls back to immediate delivery',
        expect: 'posted',
        group: 'schedule',
        name: 'scheduled-in-the-past',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                { title: 'Relative delay via header', 'x-delay': '5m' },
                'Delivered five minutes from now.',
            ),
        description: 'x-delay with a relative duration (s/m/h/d/w)',
        expect: 'scheduled',
        group: 'schedule',
        name: 'header-delay-relative',
    },
    {
        build: ({ now, topic }) =>
            headerRequest(
                topic,
                { title: 'Absolute delay via header', 'x-delay': String(now + 3600) },
                'Delivered at an absolute unix timestamp.',
            ),
        description: 'x-delay with an absolute unix timestamp',
        expect: 'scheduled',
        group: 'schedule',
        name: 'header-delay-unix',
    },

    // ------------------------------------------------------------- headers
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                { title: 'Header publish', 'x-priority': 'urgent', 'x-tags': 'ops,pager' },
                'The raw request body becomes the message body.',
            ),
        description: 'Header-based publish — title, x-priority word, x-tags',
        expect: 'posted',
        group: 'headers',
        name: 'header-basic',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                { m: 'Body from the m header', p: '2', t: 'Short aliases', ta: 'cli,shorthand' },
                'ignored because the m header wins',
            ),
        description: 'Short header aliases — t, m, p, ta',
        expect: 'posted',
        group: 'headers',
        name: 'header-short-aliases',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                { title: 'Low priority word', 'x-priority': 'low' },
                'Priority words map to 1–5: min, low, default/none, high, max/urgent.',
            ),
        description: 'x-priority accepts words as well as digits',
        expect: 'posted',
        group: 'headers',
        name: 'header-priority-word',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                {
                    title: 'Header actions',
                    'x-actions': JSON.stringify([
                        { label: 'Open', type: 'view', url: 'https://example.com/header-action' },
                    ]),
                },
                'Actions arrive as a JSON string in x-actions.',
            ),
        description: 'x-actions carrying a JSON array',
        expect: 'posted',
        group: 'headers',
        name: 'header-actions-json',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                {
                    title: 'Header media',
                    'x-banner': SAMPLE_BANNER,
                    'x-inline-images': SAMPLE_IMAGE,
                },
                'Media headers accept a bare URL, a comma-separated list or JSON.',
            ),
        description: 'x-banner and x-inline-images as plain URLs',
        expect: 'posted',
        group: 'headers',
        name: 'header-media',
    },
    {
        build: ({ topic }) =>
            headerRequest(
                topic,
                { title: 'Message override', 'x-message': 'This header replaces the raw body.' },
                'raw body that gets discarded',
            ),
        description: 'x-message takes precedence over the raw request body',
        expect: 'posted',
        group: 'headers',
        name: 'header-message-override',
    },

    // -------------------------------------------------------------- errors
    {
        build: ({ topic }) => jsonRequest(topic, { body: '   ', title: '' }),
        description: '400 missing_content — title and body both blank after trim',
        expect: 'error',
        group: 'errors',
        name: 'error-missing-content',
    },
    {
        build: () => jsonRequest('Not a valid topic!', { title: 'Never stored' }),
        description: '400 invalid_topic_name — topic must match [a-z0-9][a-z0-9/_-]*[a-z0-9]',
        expect: 'error',
        group: 'errors',
        name: 'error-invalid-topic-name',
    },
    {
        build: ({ topic }) => jsonRequest(topic, { priority: 6, title: 'Priority 6' }),
        description: '422 validation — priority is constrained to 1–5',
        expect: 'error',
        group: 'errors',
        name: 'error-priority-out-of-range',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [
                    { type: 'view', url: 'https://example.com/one' },
                    { type: 'view', url: 'https://example.com/two' },
                    { type: 'acknowledge' },
                ],
                title: 'Three actions',
            }),
        description: '422 validation — actions is capped at 2 entries',
        expect: 'error',
        group: 'errors',
        name: 'error-too-many-actions',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [{ label: 'Nowhere', type: 'view' }],
                title: 'View without url',
            }),
        description: 'actions error — a view action requires a url',
        expect: 'error',
        group: 'errors',
        name: 'error-view-action-without-url',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [
                    { type: 'view', url: 'https://example.com/same' },
                    { type: 'view', url: 'https://example.com/same' },
                ],
                title: 'Duplicate view urls',
            }),
        description: 'actions error — duplicate view urls are rejected',
        expect: 'error',
        group: 'errors',
        name: 'error-duplicate-view-url',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                actions: [{ type: 'snooze' }],
                title: 'Unknown action type',
            }),
        description: '422 validation — only view and acknowledge exist',
        expect: 'error',
        group: 'errors',
        name: 'error-unknown-action-type',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                bannerImage: 'ftp://example.com/banner.png',
                title: 'Non-http banner',
            }),
        description: '400 invalid_media — media hrefs must be http(s)',
        expect: 'error',
        group: 'errors',
        name: 'error-invalid-media-url',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, {
                inlineImages: Array.from(
                    { length: 20 },
                    (_value, index) => `${SAMPLE_IMAGE}?n=${index}`,
                ),
                title: 'Twenty inline images',
            }),
        description: '400 invalid_media — exceeds the per-array inline limit of every plan',
        expect: 'error',
        group: 'errors',
        name: 'error-too-many-inline-images',
    },
    {
        build: ({ now, topic }) =>
            jsonRequest(topic, {
                scheduledAt: now + 2 * 365 * 24 * 60 * 60,
                title: 'Two years out',
            }),
        description: 'scheduling error — scheduledAt may not exceed one year',
        expect: 'error',
        group: 'errors',
        name: 'error-schedule-too-far-ahead',
    },
    {
        build: ({ topic }) =>
            jsonRequest(topic, { body: 'x'.repeat(32_769), title: 'Oversized body' }),
        description: '422 validation — body is capped at 32768 characters',
        expect: 'error',
        group: 'errors',
        name: 'error-body-too-long',
    },
    {
        build: ({ topic }) => jsonRequest(topic, { title: 'T'.repeat(257) }),
        description: '422 validation — title is capped at 256 characters',
        expect: 'error',
        group: 'errors',
        name: 'error-title-too-long',
    },

    // ------------------------------------------------------------ showcase
    // Demo content for screenshots and walkthroughs: what a real cron/CI/alerting
    // stack would actually emit. These ignore --topic and publish to the seeded
    // topics instead, so the inbox groups the way a team's would. Priorities track
    // severity — 5 is reserved for the two that should wake someone.
    {
        build: () =>
            jsonRequest('alerts/prod', {
                actions: [
                    {
                        label: 'Open trace',
                        type: 'view',
                        url: 'https://status.emitsignal.com/traces/9f4c1ab',
                    },
                ],
                bannerImage: {
                    href: showcaseAsset('latency-p99.png'),
                    title: 'p99 response time, last 30 minutes',
                },
                body: [
                    '/api/events is averaging 2.8s, with p99 at 6.4s. The error budget for',
                    'this month is 61% consumed.',
                    '',
                    'Environment: production',
                    'Service:     api-gateway',
                    'Version:     v2.14.3',
                    'Region:      us-east-1',
                    'Instance:    4× c7g.large',
                    'Status:      degraded',
                    'Started:     2 minutes ago',
                ].join('\n'),
                priority: 4,
                tags: ['latency', 'sev2', 'api-gateway'],
                title: 'Production API latency spike',
            }),
        description: 'Latency regression with a p99 chart and a tap-through to the trace',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-latency-spike',
    },
    {
        build: () =>
            jsonRequest('alerts/prod', {
                actions: [{ label: 'Acknowledge', type: 'acknowledge' }],
                bannerImage: {
                    href: showcaseAsset('pool-saturation.webp'),
                    title: 'Connection pool saturation',
                },
                body: [
                    'orders-primary has been at max_connections for 4 minutes. New checkouts',
                    'are failing with 503 while the pool drains.',
                    '',
                    'Database:  postgres 16.3',
                    'Host:      orders-primary',
                    'In use:    100 / 100',
                    'Waiting:   38 clients',
                    'Longest:   query running 94s (reporting/daily_rollup)',
                ].join('\n'),
                priority: 5,
                tags: ['database', 'sev1', 'paging'],
                title: 'Database connection pool exhausted',
            }),
        description: 'Page-worthy database saturation with an acknowledge action',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-pool-exhausted',
    },
    {
        build: () =>
            jsonRequest('alerts/prod', {
                actions: [
                    {
                        label: 'View certificate',
                        type: 'view',
                        url: 'https://status.emitsignal.com/certs/cdn',
                    },
                ],
                body: [
                    'The certificate for cdn.acme.io expires in 7 days and auto-renewal has',
                    'not run. Last successful renewal was 83 days ago.',
                    '',
                    'Domain:   cdn.acme.io',
                    'Issuer:   ISRG Root X1',
                    'Expires:  2026-08-15T04:12:00Z',
                    'Renewal:  certbot timer inactive on edge-02',
                ].join('\n'),
                priority: 4,
                tags: ['tls', 'renewal'],
                title: 'TLS certificate expires in 7 days',
            }),
        description: 'Scheduled-risk warning that needs action before a deadline',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-cert-expiring',
    },
    {
        build: () =>
            jsonRequest('deploy/prod', {
                actions: [
                    {
                        label: 'Release notes',
                        type: 'view',
                        url: 'https://github.com/kevenleone/emitsignal/releases',
                    },
                ],
                body: [
                    'api-gateway v2.14.3 is live on all four instances. Health checks green',
                    'for 3 minutes.',
                    '',
                    'Commit:   9f4c1ab',
                    'Duration: 2m 41s',
                    'Migrated: 2 migrations',
                    'Rollout:  100%',
                ].join('\n'),
                priority: 3,
                tags: ['release', 'v2.14.3'],
                title: 'Deploy succeeded · api-gateway v2.14.3',
            }),
        description: 'Routine successful deploy — informational, not urgent',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-deploy-succeeded',
    },
    {
        build: () =>
            jsonRequest('deploy/prod', {
                bannerImage: {
                    href: showcaseAsset('error-rate.webp'),
                    title: 'Error rate during the canary window',
                },
                body: [
                    '5xx rate crossed the 5% guardrail at 10% traffic. The canary was pulled',
                    'automatically and traffic is back on v2.14.2.',
                    '',
                    'Candidate:  v2.14.4',
                    'Peak error: 7.4% (guardrail 5%)',
                    'Exposure:   10% for 6m 20s',
                    'Action:     rolled back automatically',
                ].join('\n'),
                priority: 4,
                tags: ['canary', 'rollback'],
                title: 'Canary rolled back automatically',
            }),
        description: 'Automatic rollback with the error-rate chart that triggered it',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-canary-rollback',
    },
    {
        build: () =>
            jsonRequest('ci/web', {
                actions: [
                    {
                        label: 'View run',
                        type: 'view',
                        url: 'https://github.com/kevenleone/emitsignal/actions/runs/4821',
                    },
                ],
                body: [
                    'Two tests failed in the OAuth callback suite. The PKCE verifier is not',
                    'matching the stored challenge.',
                    '',
                    'Branch:   feat/oauth-pkce',
                    'Commit:   9f4c1ab',
                    'Failed:   2 of 249',
                    'Duration: 41.2s',
                ].join('\n'),
                inlineAttachments: [
                    { href: showcaseAsset('build-4821.log'), title: 'build-4821.log' },
                ],
                priority: 4,
                tags: ['ci', 'failed'],
                title: 'Build failed · feat/oauth-pkce',
            }),
        description: 'Failing CI run with the build log attached',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-build-failed',
    },
    {
        build: () =>
            jsonRequest('ci/web', {
                body: 'main · 312 tests · 41s · no lint or type errors.',
                priority: 2,
                tags: ['ci', 'passed'],
                title: 'Build passed · main',
            }),
        description: 'Routine green build — low priority so it stays out of the way',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-build-passed',
    },
    {
        build: () =>
            jsonRequest('cron/backup', {
                body: [
                    'orders-primary dumped and uploaded. Restore smoke test passed on staging.',
                    '',
                    'Size:      14.2 GB compressed (51.8 GB raw)',
                    'Duration:  6m 12s',
                    'Target:    s3://acme-backups/postgres/2026-08-08/',
                    'Retention: 35 daily · 12 monthly',
                ].join('\n'),
                inlineAttachments: [
                    { href: showcaseAsset('backup-manifest.txt'), title: 'backup-manifest.txt' },
                ],
                priority: 2,
                tags: ['cron', 'success'],
                title: 'Nightly backup completed · 14.2 GB → s3',
            }),
        description: 'Successful cron job with its manifest attached',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-backup-done',
    },
    {
        build: () =>
            jsonRequest('cron/backup', {
                body: [
                    'The 03:00 run exited early because a snapshot lock from yesterday was',
                    'still held. No backup was written for 2026-08-07.',
                    '',
                    'Lock:     /var/lib/backup/.snapshot.lock',
                    'Held by:  pid 21884 (since 2026-08-07T03:00:11Z)',
                    'Skipped:  1 run',
                    'Next:     2026-08-09T03:00:00Z',
                ].join('\n'),
                priority: 4,
                tags: ['cron', 'skipped'],
                title: 'Backup skipped — snapshot lock held',
            }),
        description: 'Silent-failure case: the job that did not run is the interesting one',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-backup-skipped',
    },
    {
        build: () =>
            jsonRequest('alerts/prod', {
                actions: [{ label: 'This was me', type: 'acknowledge' }],
                body: [
                    'Public-key login for deploy@edge-02 from an address outside the office',
                    'and VPN ranges. Session is still open.',
                    '',
                    'User:     deploy',
                    'Host:     edge-02',
                    'Source:   203.0.113.44 (AS64512, Frankfurt)',
                    'Key:      SHA256:7hQ2…d1Ac',
                    'Opened:   1 minute ago',
                ].join('\n'),
                priority: 5,
                tags: ['security', 'ssh', 'paging'],
                title: 'SSH login from an unrecognised address',
            }),
        description: 'Security event that needs a human to confirm it was expected',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-ssh-login',
    },
    {
        build: () =>
            jsonRequest('billing/stripe', {
                body: 'Acme Corp · invoice INV-2026-0812 · $4,820.00 · card ending 4242.',
                priority: 1,
                tags: ['stripe', 'billing'],
                title: 'invoice.paid · $4,820.00',
            }),
        description: 'Informational receipt at the minimum priority — silent by design',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-invoice-paid',
    },
    {
        build: () =>
            jsonRequest('home/sensors', {
                body: 'Garage door has been open for 12 minutes. Nobody is home according to presence.',
                priority: 3,
                tags: ['home', 'sensor'],
                title: 'Garage door open for 12m',
            }),
        description: 'Personal automation — topics are free-form, so this sits beside prod',
        expect: 'posted',
        group: 'showcase',
        name: 'showcase-garage-door',
    },
];

function buildPriorityScenarios(): Scenario[] {
    return [1, 2, 3, 4, 5].map((priority) => ({
        build: ({ topic }: ScenarioContext) =>
            jsonRequest(topic, {
                body: `Priority ${priority}: ${PRIORITY_LABELS[priority]}.`,
                priority,
                title: `Priority ${priority}`,
            }),
        description: `priority ${priority} (${PRIORITY_LABELS[priority]})`,
        expect: 'posted' as const,
        group: 'json' as const,
        name: `priority-${priority}`,
    }));
}

// Anything whose content-type is not application/json goes through
// parsePublishHeaders, with the raw request body used as the message body.
function headerRequest(
    topic: string,
    headers: Record<string, string>,
    rawBody: string,
): ScenarioRequest {
    return {
        body: rawBody,
        headers: { 'content-type': 'text/plain; charset=utf-8', ...headers },
        topic,
    };
}

function jsonRequest(topic: string, payload: Record<string, unknown>): ScenarioRequest {
    return {
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
        topic,
    };
}
