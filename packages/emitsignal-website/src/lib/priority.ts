export type { Priority } from '@emitsignal/shared/priority';

export {
    PRIORITY_HEX,
    PRIORITY_LABEL,
    priorityHex,
    priorityLabel,
} from '@emitsignal/shared/priority';

import type { Priority } from '@emitsignal/shared/priority';

export function hashTopicLevel(topic: string): Priority {
    const levels: Priority[] = [1, 2, 3, 4, 5];

    return levels[hashString(topic) % levels.length];
}

function hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}
