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

export function hashTopicLevel(topic: string): Priority {
    const levels: Priority[] = [1, 2, 3, 4, 5];

    return levels[hashString(topic) % levels.length]!;
}

export function priorityHex(level: number): string {
    return PRIORITY_HEX[level as Priority] ?? PRIORITY_HEX[3];
}

export function priorityLabel(level: number): string {
    return PRIORITY_LABEL[level as Priority] ?? PRIORITY_LABEL[3];
}

function hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}
