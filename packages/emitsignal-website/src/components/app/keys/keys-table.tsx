import { MoreHorizontal } from 'lucide-react';

import { Dot } from '#/components/ui/dot';
import { Pill } from '#/components/ui/pill';
import { Sparkline } from '#/components/ui/sparkline';

interface ApiKey {
    last: string;
    name: string;
    prefix: string;
    requests: number;
    revoked?: boolean;
    scope: string;
}

const KEYS: ApiKey[] = [
    {
        last: '4m ago',
        name: 'prod-write',
        prefix: 'es_live_p9k2',
        requests: 12842,
        scope: 'publish:*',
    },
    {
        last: '21m ago',
        name: 'ci-runner',
        prefix: 'es_live_c8f4',
        requests: 4218,
        scope: 'publish:ci/*, deploy/*',
    },
    {
        last: '3h ago',
        name: 'sentry-bridge',
        prefix: 'es_live_xb1',
        requests: 942,
        scope: 'publish:errors/*',
    },
    { last: '2d ago', name: 'maya-laptop', prefix: 'es_live_m4z9', requests: 89, scope: 'read:*' },
    {
        last: '14d ago',
        name: 'old-staging',
        prefix: 'es_live_o12k',
        requests: 0,
        revoked: true,
        scope: 'publish:staging/*',
    },
];

const COL_TEMPLATE = 'grid-cols-[1.2fr_1.4fr_1.6fr_1fr_1fr_40px]';
const SPARK = [2, 4, 3, 8, 5, 12, 9, 14, 11, 18, 15, 22];

export function KeysTable() {
    return (
        <div className="mb-7 overflow-hidden rounded-lg border border-line bg-elev">
            <div
                className={`grid ${COL_TEMPLATE} gap-4 border-b border-line px-4.5 py-2.5 font-mono text-[10px] uppercase tracking-[1.2px] text-dim`}
            >
                <span>NAME</span>
                <span>KEY</span>
                <span>SCOPE</span>
                <span>LAST USED</span>
                <span>REQUESTS · 7D</span>
                <span />
            </div>
            {KEYS.map((key, i) => (
                <KeyRow apiKey={key} key={i} last={i === KEYS.length - 1} />
            ))}
        </div>
    );
}

function KeyRow({ apiKey, last }: { apiKey: ApiKey; last: boolean }) {
    return (
        <div
            className={`grid ${COL_TEMPLATE} gap-4 px-4.5 py-3 items-center ${last ? '' : 'border-b border-line'} ${apiKey.revoked ? 'opacity-45' : ''}`}
        >
            <div className="flex items-center gap-2">
                <Dot level={apiKey.revoked ? 1 : 3} size={5} />
                <span className="text-[13px] font-medium">{apiKey.name}</span>
                {apiKey.revoked && <Pill tone="danger">revoked</Pill>}
            </div>
            <span className="font-mono text-[12px] text-muted">{apiKey.prefix}_••••••</span>
            <span className="font-mono text-[11.5px] text-accent">{apiKey.scope}</span>
            <span className="font-mono text-[11.5px] text-dim">{apiKey.last}</span>
            <div className="flex items-center gap-2.5">
                <span className="font-mono text-[12px] text-fg">
                    {apiKey.requests.toLocaleString()}
                </span>
                {!apiKey.revoked && <Sparkline data={SPARK} height={18} width={56} />}
            </div>
            <MoreHorizontal className="text-dim" size={14} />
        </div>
    );
}
