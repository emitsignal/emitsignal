import { ExtensionStorage } from '@bacons/apple-targets';
import ExpoConstants from 'expo-constants';
import { Platform } from 'react-native';

// Bridge to the iOS widget extension: snapshots are written into the
// app-group UserDefaults so widgets can render offline. ExtensionStorage
// no-ops when the native module is unavailable (Android, Expo Go), but we
// still guard to avoid pointless serialization work off-platform.

const WIDGET_SNAPSHOT_KEY = 'widget_snapshot';

let extensionStorage: ExtensionStorage | null = null;

export function clearWidgetSnapshot(): void {
    const storage = getExtensionStorage();

    if (!storage) {
        return;
    }

    storage.remove(WIDGET_SNAPSHOT_KEY);

    ExtensionStorage.reloadWidget();
}

export function writeWidgetSnapshot(snapshotJson: string): void {
    const storage = getExtensionStorage();

    if (!storage) {
        return;
    }

    storage.set(WIDGET_SNAPSHOT_KEY, snapshotJson);

    ExtensionStorage.reloadWidget();
}

function getExtensionStorage(): ExtensionStorage | null {
    if (Platform.OS !== 'ios') {
        return null;
    }

    if (!extensionStorage) {
        const appGroup = ExpoConstants.expoConfig?.extra?.appGroup;

        if (typeof appGroup !== 'string') {
            return null;
        }

        extensionStorage = new ExtensionStorage(appGroup);
    }

    return extensionStorage;
}
