import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@emitsignal/read_messages';

type ReadIdsListener = () => void;

const readIdsListeners = new Set<ReadIdsListener>();

export async function addReadId(id: string): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(KEY);

        const ids: string[] = raw ? JSON.parse(raw) : [];

        if (!ids.includes(id)) {
            ids.push(id);

            await AsyncStorage.setItem(KEY, JSON.stringify(ids));

            for (const listener of readIdsListeners) {
                listener();
            }
        }
    } catch {
        // silently ignore
    }
}

export async function getReadIds(): Promise<Set<string>> {
    try {
        const raw = await AsyncStorage.getItem(KEY);

        if (!raw) {
            return new Set();
        }

        const ids = JSON.parse(raw);

        return new Set(Array.isArray(ids) ? ids : []);
    } catch {
        return new Set();
    }
}

// Lets observers (e.g. the widget snapshot sync) react when a message is
// marked read without polling AsyncStorage.
export function subscribeReadIds(listener: ReadIdsListener): () => void {
    readIdsListeners.add(listener);

    return () => {
        readIdsListeners.delete(listener);
    };
}
