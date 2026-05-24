import { Code } from '#/components/ui/code';
import { Dot } from '#/components/ui/dot';
import { SubHead } from '#/components/ui/sub-head';

const REACH = ['3 subscribers · all devices', '#releases on slack', 'alex@acme.io · email'];

export function PreviewColumn() {
    return (
        <aside className="w-[380px] shrink-0 overflow-auto bg-[#0a0614] p-6">
            <SubHead>PREVIEW · android push</SubHead>
            <div className="mb-5 rounded-2xl border border-line bg-elev p-3.5">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] text-dim">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-accent text-[9px] font-bold text-bg">
                        E
                    </span>
                    <span>EMITSIGNAL · deploy/prod · now</span>
                </div>
                <p className="m-0 mb-1 text-[14px] font-semibold">
                    Deploy succeeded · api-gateway v2.14.3
                </p>
                <p className="m-0 text-[12.5px] leading-[1.4] text-muted">
                    Rolled out api-gateway v2.14.3 to prod in 1m 42s.
                </p>
            </div>

            <SubHead>EQUIVALENT · curl</SubHead>
            <Code language="BASH">
                {`curl -X POST emitsignal.com/deploy/prod \\
  -H "Authorization: Bearer es_live_••••" \\
  -H "Priority: 4" \\
  -H "Tags: vercel,prod,release" \\
  -d "Deploy succeeded · v2.14.3"`}
            </Code>

            <div className="h-4" />

            <SubHead>WILL REACH</SubHead>
            <div className="flex flex-col gap-2">
                {REACH.map((r, i) => (
                    <div
                        className="flex items-center gap-2 font-mono text-[11.5px] text-muted"
                        key={i}
                    >
                        <Dot level={2} size={5} />
                        {r}
                    </div>
                ))}
            </div>
        </aside>
    );
}
