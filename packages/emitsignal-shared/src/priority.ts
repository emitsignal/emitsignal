export type Priority = 1 | 2 | 3 | 4 | 5;

export const PRIORITY_HEX: Record<Priority, string> = {
    1: '#818cf8',
    2: '#a78bfa',
    3: '#c4b5fd',
    4: '#fbbf24',
    5: '#f87171',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
    1: 'Low',
    2: 'Normal',
    3: 'Elevated',
    4: 'High',
    5: 'Critical',
};

export function priorityHex(level: number): string {
    return PRIORITY_HEX[level as Priority] ?? PRIORITY_HEX[3];
}

export function priorityLabel(level: number): string {
    return PRIORITY_LABEL[level as Priority] ?? PRIORITY_LABEL[3];
}
