import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export interface AppUpdates {
    checkForUpdate: () => Promise<void>;
    isSupported: boolean;
    status: UpdateStatus;
}

export type UpdateStatus = 'checking' | 'downloading' | 'idle';

export function useAppUpdates(): AppUpdates {
    const [status, setStatus] = useState<UpdateStatus>('idle');

    const checkForUpdate = useCallback(async () => {
        if (!Updates.isEnabled) {
            Alert.alert(
                'Updates unavailable',
                'This build loads JavaScript from a development server.',
            );

            return;
        }

        setStatus('checking');

        try {
            const result = await Updates.checkForUpdateAsync();

            if (!result.isAvailable) {
                Alert.alert('Up to date', 'You are running the latest version.');

                return;
            }

            setStatus('downloading');

            await Updates.fetchUpdateAsync();

            Alert.alert('Update ready', 'Restart EmitSignal to apply it.', [
                { style: 'cancel', text: 'Later' },
                { onPress: () => Updates.reloadAsync(), text: 'Restart now' },
            ]);
        } catch (error) {
            Alert.alert(
                'Update check failed',
                error instanceof Error ? error.message : String(error),
            );
        } finally {
            setStatus('idle');
        }
    }, []);

    return { checkForUpdate, isSupported: Updates.isEnabled, status };
}
