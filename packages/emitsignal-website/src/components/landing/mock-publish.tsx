import { publishUrl } from '@emitsignal/shared/topic';
import { Bell } from 'lucide-react';

import { CopyButton } from '#/components/ui/copy-button';
import { Dot } from '#/components/ui/dot';
import { PUBLISH_BASE_URL } from '#/lib/api';

const ENDPOINT = publishUrl(PUBLISH_BASE_URL, 'alerts/prod');
const COMMAND = `curl -d "Production API latency spike" -H "x-priority: 5" ${ENDPOINT}`;

export function MockPublish() {
    return (
        <div className="flex flex-col items-stretch">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-deep px-4 py-4">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] leading-[1.5]">
                    <span className="text-success">$</span>{' '}
                    <span className="text-dim">curl -d</span>{' '}
                    <span className="text-warn">"Production API latency spike"</span>{' '}
                    <span className="text-dim">-H</span>{' '}
                    <span className="text-warn">"x-priority: 5"</span>{' '}
                    <span className="text-accent">{ENDPOINT}</span>
                </code>

                <CopyButton className="shrink-0" value={COMMAND} />
            </div>

            <Connector />

            <div className="flex items-start gap-3.5 rounded-xl border border-line bg-elev p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent/15">
                    <Bell className="text-accent" size={16} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="m-0 text-[14px] font-semibold text-fg">EmitSignal</p>
                        <Dot level={5} size={6} />
                        <span className="font-mono text-[11px] text-dim">alerts/prod</span>
                        <span className="ml-auto font-mono text-[11px] text-faint">now</span>
                    </div>

                    <p className="m-0 mt-1.5 text-[13.5px] leading-[1.5] text-muted">
                        Production API latency spike
                    </p>
                </div>
            </div>

            <p className="m-0 mt-4 text-center font-mono text-[11px] text-faint">
                Same message on phone, terminal, and web inbox
            </p>
        </div>
    );
}

function Connector() {
    return (
        <div aria-hidden className="flex flex-col items-center py-3">
            <span className="h-8 w-px bg-gradient-to-b from-line to-accent/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
        </div>
    );
}
