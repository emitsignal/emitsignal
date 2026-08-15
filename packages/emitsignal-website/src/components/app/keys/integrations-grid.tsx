import { Pill } from '#/components/ui/pill';
import { cn } from '#/lib/cn';
import { withAlpha } from '#/lib/color';

interface Integration {
    color: string;
    connected: boolean;
    description: string;
    events?: number;
    name: string;
}

const INTEGRATIONS: Integration[] = [
    {
        color: '#fff',
        connected: true,
        description: 'PRs, issues, deploys',
        events: 142,
        name: 'GitHub',
    },
    {
        color: 'var(--color-accent)',
        connected: true,
        description: 'Errors → channel',
        events: 34,
        name: 'Sentry',
    },
    {
        color: 'var(--color-info)',
        connected: true,
        description: 'Webhooks',
        events: 18,
        name: 'Stripe',
    },
    { color: 'var(--color-warn)', connected: false, description: 'Alerts', name: 'Datadog' },
    {
        color: 'var(--color-pink)',
        connected: true,
        description: 'Deploy hooks',
        events: 56,
        name: 'Vercel',
    },
    {
        color: 'var(--color-success)',
        connected: false,
        description: 'On-call rotation',
        name: 'PagerDuty',
    },
];

export function IntegrationsGrid() {
    return (
        <div className="grid grid-cols-3 gap-3">
            {INTEGRATIONS.map((integration) => (
                <IntegrationCard integration={integration} key={integration.name} />
            ))}
        </div>
    );
}

function IntegrationCard({ integration }: { integration: Integration }) {
    return (
        <div
            className={cn(
                'flex items-center gap-3.5 rounded-xl border bg-elev p-4',
                integration.connected ? 'border-accent/35' : 'border-line',
            )}
        >
            <div
                className="flex h-[38px] w-[38px] items-center justify-center rounded-lg font-mono text-[16px] font-bold"
                style={{ background: withAlpha(integration.color, 13), color: integration.color }}
            >
                {integration.name[0]}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{integration.name}</span>
                    {integration.connected && <Pill tone="success">connected</Pill>}
                </div>
                <p className="m-0 mt-0.5 text-[12px] text-muted">{integration.description}</p>
                {integration.connected && integration.events !== undefined && (
                    <p className="m-0 mt-1 font-mono text-[10.5px] text-dim">
                        {integration.events} events · 24h
                    </p>
                )}
            </div>
            <button
                className={cn(
                    'rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold',
                    integration.connected ? 'border-line text-muted' : 'border-accent text-accent',
                )}
            >
                {integration.connected ? 'manage' : 'connect'}
            </button>
        </div>
    );
}
