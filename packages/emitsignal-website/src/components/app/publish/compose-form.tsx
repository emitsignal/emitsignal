import { SubHead } from '#/components/ui/sub-head';
import { cn } from '#/lib/cn';

interface DeliveryOption {
    enabled: boolean;
    label: string;
}

const TAGS = ['vercel', 'prod', 'release'];

const DELIVERY: DeliveryOption[] = [
    { enabled: true, label: 'push · all subs' },
    { enabled: true, label: 'email · p>=4' },
    { enabled: true, label: 'slack #releases' },
    { enabled: false, label: 'sms · on-call' },
    { enabled: false, label: 'webhook → datadog' },
];

const SELECTED_PRIORITY = 4;

export function ComposeForm() {
    return (
        <div className="min-w-0 flex-1 overflow-auto border-r border-line p-7">
            <SubHead>topic</SubHead>
            <div className="mb-5.5 flex items-center rounded-lg border border-accent/40 bg-elev px-3.5 py-2.5">
                <span className="font-mono text-[13px] text-dim">emitsignal.sh/</span>
                <span className="font-mono text-[13px] font-medium text-fg">deploy/prod</span>
                <span className="ml-auto font-mono text-[10.5px] text-dim">
                    142 messages · 3 subs
                </span>
            </div>

            <SubHead>title</SubHead>
            <div className="mb-4 rounded-lg border border-line bg-elev px-3.5 py-3 text-[15px] font-semibold">
                Deploy succeeded · api-gateway v2.14.3
            </div>

            <SubHead>body · markdown</SubHead>
            <div className="mb-5.5 min-h-[70px] rounded-lg border border-line bg-elev px-3.5 py-3 text-[13px] leading-[1.5] text-muted">
                Rolled out <strong className="text-fg">api-gateway v2.14.3</strong> to prod in 1m
                42s.
                <br />
                Highlights: oauth-pkce, retry-budget tweak, 2 dependency bumps.
            </div>

            <div className="mb-5.5 grid grid-cols-[1fr_1.4fr] gap-5">
                <div>
                    <SubHead>priority</SubHead>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((p) => (
                            <PriorityChip key={p} selected={p === SELECTED_PRIORITY} value={p} />
                        ))}
                    </div>
                </div>
                <div>
                    <SubHead>tags</SubHead>
                    <TagInput />
                </div>
            </div>

            <SubHead>delivery</SubHead>
            <div className="flex flex-wrap gap-2">
                {DELIVERY.map((d, i) => (
                    <DeliveryChip key={i} option={d} />
                ))}
            </div>
        </div>
    );
}

function DeliveryChip({ option }: { option: DeliveryOption }) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11.5px] font-medium border',
                option.enabled
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-elev border-line text-muted',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    option.enabled ? 'bg-accent' : 'bg-faint',
                )}
            />
            {option.label}
        </div>
    );
}

function PriorityChip({ selected, value }: { selected: boolean; value: number }) {
    return (
        <div
            className={cn(
                'flex-1 rounded-md py-2 text-center font-mono text-[12px] font-semibold border',
                selected
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-elev border-line text-muted',
            )}
        >
            p{value}
        </div>
    );
}

function TagInput() {
    return (
        <div className="flex h-[38px] items-center gap-1.5 rounded-lg border border-line bg-elev px-2 py-1.5">
            {TAGS.map((t) => (
                <span
                    className="rounded border border-line bg-chip px-2 py-0.5 font-mono text-[11px] text-muted"
                    key={t}
                >
                    {t}
                    <span className="ml-1.5 text-faint">×</span>
                </span>
            ))}
            <span className="font-mono text-[11px] text-dim">+ add</span>
        </div>
    );
}
