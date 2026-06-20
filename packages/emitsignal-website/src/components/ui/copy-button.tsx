import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { cn } from '#/lib/cn';

interface CopyButtonProps {
    className?: string;
    value: string;
}

export function CopyButton({ className, value }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);

        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            className={cn(
                'flex items-center gap-1 rounded-md border border-line bg-elev px-2 py-1 font-mono text-[10.5px] text-muted hover:bg-elev-2 hover:text-fg',
                className,
            )}
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy'}
            type="button"
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'copied' : 'copy'}
        </button>
    );
}
