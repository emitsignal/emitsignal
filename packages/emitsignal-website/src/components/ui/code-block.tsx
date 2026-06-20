import { CopyButton } from '#/components/ui/copy-button';
import { SubHeading } from '#/components/ui/sub-head';

interface CodeBlockProps {
    code: string;
    copyable?: boolean;
    label?: string;
}

export function CodeBlock({ code, copyable = true, label }: CodeBlockProps) {
    return (
        <div className="mb-4.5">
            {label !== undefined ? <SubHeading>{label}</SubHeading> : null}
            <div className="relative">
                {copyable ? <CopyButton className="absolute right-2 top-2" value={code} /> : null}
                <pre className="overflow-auto rounded-lg border border-line bg-deep p-4 font-mono text-[12px] leading-[1.6] text-muted">
                    {code}
                </pre>
            </div>
        </div>
    );
}
