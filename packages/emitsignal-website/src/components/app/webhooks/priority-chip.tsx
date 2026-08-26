import { withAlpha } from '#/lib/color';

interface PriorityChipProps {
    active: boolean;
    onClick: () => void;
    value: number;
}

export function PriorityChip({ active, onClick, value }: PriorityChipProps) {
    const hex = `var(--color-p${value})`;

    return (
        <button
            className="flex flex-1 cursor-pointer items-center justify-center rounded-md border py-1.5 font-mono text-[11.5px] font-semibold"
            onClick={onClick}
            style={
                active
                    ? { background: withAlpha(hex, 13), borderColor: hex, color: hex }
                    : {
                          background: 'var(--color-elev)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-dim)',
                      }
            }
            type="button"
        >
            {value}
        </button>
    );
}
