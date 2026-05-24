// Sample data used across the EmitSignal web surfaces

export interface SampleNotif {
    body: string;
    channel: string;
    icon?: string;
    iconBg?: string;
    iconFg?: string;
    id: string;
    kind: string;
    meta?: string;
    priority: number;
    tags: string[];
    time: string;
    title: string;
    topic: string;
}

export const SAMPLE_NOTIFS: SampleNotif[] = [
    {
        body: 'api-gateway → vercel prod',
        channel: 'deploy/prod',
        icon: '▲',
        iconBg: '#0a0a0a',
        iconFg: '#fff',
        id: 'n1',
        kind: 'deploy',
        meta: 'v2.14.3 · 1m 42s',
        priority: 4,
        tags: ['vercel', 'prod'],
        time: '2m',
        title: 'Deploy succeeded',
        topic: 'Deploy',
    },
    {
        body: 'mem.used > 92% for 5m (threshold 90%)',
        channel: 'alerts/prod',
        id: 'n2',
        kind: 'alert',
        meta: 'us-east-1 · i-0a3f2b',
        priority: 5,
        tags: ['sev2', 'resolved-auto'],
        time: '4m',
        title: 'High memory on api-02',
        topic: 'Alerts',
    },
    {
        body: 'feat/oauth-pkce · 247 tests green',
        channel: 'ci/web',
        id: 'n3',
        kind: 'ci',
        meta: '#4821 · 3m 12s',
        priority: 3,
        tags: ['ci', 'passed'],
        time: '12m',
        title: 'Build passed',
        topic: 'CI',
    },
    {
        body: 'maya approved · refactor: extract topic router',
        channel: 'github/emitsignal',
        id: 'n4',
        kind: 'github',
        meta: '+142 / -89',
        priority: 2,
        tags: ['approved'],
        time: '34m',
        title: 'PR #482 reviewed',
        topic: 'GitHub',
    },
    {
        body: 'dumped 14.2 GB → s3://backups/2026-04-21',
        channel: 'cron/backup',
        id: 'n5',
        kind: 'cron',
        meta: 'exit 0 · 8m 03s',
        priority: 3,
        tags: ['cron', 'success'],
        time: '1h',
        title: 'nightly-backup.sh ✓',
        topic: 'Cron',
    },
    {
        body: "Cannot read property 'id' of undefined — 34 events in 2m",
        channel: 'errors/web',
        id: 'n6',
        kind: 'error',
        meta: 'web@1.42.0 · chrome',
        priority: 5,
        tags: ['new', 'x34'],
        time: '1h',
        title: 'TypeError spike',
        topic: 'Errors',
    },
    {
        body: 'api-gateway → v2.14.2 (manual, by alex)',
        channel: 'deploy/prod',
        id: 'n7',
        kind: 'deploy',
        meta: 'vercel · us-east',
        priority: 4,
        tags: ['rollback'],
        time: '2h',
        title: 'Rollback initiated',
        topic: 'Deploy',
    },
];

export interface SampleChannel {
    activity: number[];
    count: number;
    desc: string;
    id: string;
    muted: boolean;
    name: string;
    prio: number;
    unread: number;
}

export const SAMPLE_CHANNELS: SampleChannel[] = [
    {
        activity: [1, 2, 1, 3, 2, 4, 3, 5, 3, 2, 4, 2],
        count: 142,
        desc: 'Production deployments',
        id: 'c1',
        muted: false,
        name: 'deploy/prod',
        prio: 4,
        unread: 2,
    },
    {
        activity: [0, 0, 1, 0, 1, 0, 2, 1, 0, 1, 0, 0],
        count: 23,
        desc: 'Server alerts & pages',
        id: 'c2',
        muted: false,
        name: 'alerts/prod',
        prio: 5,
        unread: 1,
    },
    {
        activity: [3, 5, 4, 6, 5, 7, 8, 6, 7, 5, 6, 4],
        count: 891,
        desc: 'Frontend CI pipelines',
        id: 'c3',
        muted: false,
        name: 'ci/web',
        prio: 3,
        unread: 0,
    },
    {
        activity: [1, 2, 3, 2, 1, 2, 3, 2, 3, 2, 1, 2],
        count: 240,
        desc: 'Repo events',
        id: 'c4',
        muted: false,
        name: 'github/emitsignal',
        prio: 2,
        unread: 1,
    },
    {
        activity: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        count: 62,
        desc: 'Nightly jobs',
        id: 'c5',
        muted: false,
        name: 'cron/backup',
        prio: 3,
        unread: 0,
    },
    {
        activity: [0, 1, 0, 2, 1, 3, 2, 5, 4, 3, 2, 3],
        count: 55,
        desc: 'Sentry → emitsignal bridge',
        id: 'c6',
        muted: false,
        name: 'errors/web',
        prio: 5,
        unread: 3,
    },
    {
        activity: [6, 5, 6, 7, 8, 7, 6, 5, 6, 7, 8, 7],
        count: 2400,
        desc: 'Home assistant stream',
        id: 'c7',
        muted: true,
        name: 'home/sensors',
        prio: 2,
        unread: 0,
    },
    {
        activity: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        count: 18,
        desc: 'Webhooks',
        id: 'c8',
        muted: false,
        name: 'stripe/payments',
        prio: 3,
        unread: 0,
    },
];
