export type Priority = 1 | 2 | 3 | 4 | 5;

const PRIORITY_HEX: Record<Priority, string> = {
    1: '#818cf8',
    2: '#a78bfa',
    3: '#c4b5fd',
    4: '#fbbf24',
    5: '#f87171',
};

export function priorityHex(level: number): string {
    return PRIORITY_HEX[level as Priority] ?? PRIORITY_HEX[3];
}
