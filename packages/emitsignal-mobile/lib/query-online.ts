import { focusManager, onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { AppState, type AppStateStatus, Platform } from 'react-native';

/**
 * Wires React Query's focus/online managers to React Native primitives so
 * queries refetch when the app returns to the foreground or regains network.
 * Call once at app start.
 */
export function setupQuerySync(): void {
    focusManager.setEventListener((handleFocus) => {
        const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
            if (Platform.OS !== 'web') {
                handleFocus(status === 'active');
            }
        });

        return () => subscription.remove();
    });

    onlineManager.setEventListener((setOnline) => {
        void getNetworkStateAsync().then((state) => setOnline(Boolean(state.isConnected)));

        const subscription = addNetworkStateListener((state) => {
            setOnline(Boolean(state.isConnected));
        });

        return () => subscription.remove();
    });
}
