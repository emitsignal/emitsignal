import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@emitsignal/read_messages';

export async function addReadId(id: string): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(KEY);

        const ids: string[] = raw ? JSON.parse(raw) : [];

        if (!ids.includes(id)) {
            ids.push(id);

            await AsyncStorage.setItem(KEY, JSON.stringify(ids));
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
