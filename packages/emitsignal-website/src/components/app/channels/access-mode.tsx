import { Book, Globe, Lock, type LucideIcon } from 'lucide-react';

import type { AccessMode } from '#/lib/api';

export const ACCESS_MODE_OPTIONS: {
    description: string;
    icon: LucideIcon;
    label: string;
    value: AccessMode;
}[] = [
    {
        description: 'Anyone can read and publish',
        icon: Globe,
        label: 'Public',
        value: 'public',
    },
    {
        description: 'Anyone can read; only members can publish',
        icon: Book,
        label: 'Read-only',
        value: 'readonly',
    },
    {
        description: 'Only members can read and publish',
        icon: Lock,
        label: 'Private',
        value: 'private',
    },
];

/**
 * Public is the default and carries no restriction, so it stays unmarked —
 * only the modes that limit who can read or publish get a glyph.
 */
export function AccessModeIcon({
    accessMode,
    size = 12,
}: {
    accessMode: AccessMode;
    size?: number;
}) {
    const option = ACCESS_MODE_OPTIONS.find((option) => option.value === accessMode);

    if (!option || option.value === 'public') {
        return null;
    }

    const Icon = option.icon;

    return (
        <span className="flex flex-shrink-0" title={`${option.label} · ${option.description}`}>
            <Icon className="text-dim" size={size} />
        </span>
    );
}
