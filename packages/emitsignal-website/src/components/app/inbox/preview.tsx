import { Code } from '#/components/ui/code';
import { Dot } from '#/components/ui/dot';
import { SubHead } from '#/components/ui/sub-head';

import { MetricChart } from './metric-chart';

export function InboxPreview() {
    return (
        <div className="min-w-0 flex-1 overflow-auto p-7">
            <div className="mb-3.5 flex items-center gap-2">
                <Dot level={5} size={8} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[1.2px] text-danger">
                    PRIORITY 5 · MAX
                </span>
                <span className="ml-auto font-mono text-[11px] text-dim">alerts/prod · 4m ago</span>
            </div>

            <h2 className="m-0 mb-2.5 text-[26px] font-semibold tracking-[-0.6px]">
                High memory on api-02
            </h2>
            <p className="m-0 mb-4.5 text-[14px] leading-[1.5] text-muted">
                mem.used &gt; 92% for 5m (threshold 90%) — host{' '}
                <span className="font-mono text-accent">i-0a3f2b</span> in us-east-1.
            </p>

            <div className="mb-6.5 flex gap-2">
                <button className="rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-bg hover:bg-accent-dim">
                    Acknowledge
                </button>
                <button className="rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] text-fg hover:bg-elev-2">
                    Open in console
                </button>
                <button className="rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] text-fg hover:bg-elev-2">
                    Snooze 1h
                </button>
            </div>

            <SubHead>METRIC</SubHead>
            <MetricChart />

            <div className="h-4.5" />

            <SubHead>PAYLOAD</SubHead>
            <Code language="JSON">
                {`{
  "topic": "alerts/prod",
  "title": "High memory on api-02",
  "priority": 5,
  "tags": ["sev2", "resolved-auto"],
  "extras": { "host": "api-02", "value": 0.924 }
}`}
            </Code>
        </div>
    );
}
