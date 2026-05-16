import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { Platform } from 'react-native';

import { useDeviceInfo } from '@/hooks/use-device-info';
import { api } from '@/lib/api';

interface DeviceContextType {
    deviceId: null | string;
    error: Error | null;
    isLoading: boolean;
    pushToken: null | string;
    refreshPushToken: () => Promise<null | string>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
    const deviceInfo = useDeviceInfo();

    // Register push token with the backend whenever it changes
    useEffect(() => {
        if (!deviceInfo.deviceId || !deviceInfo.pushToken) {
            return;
        }

        const platform = (
            Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
        ) as 'android' | 'ios' | 'web';

        api.registerPushToken({
            deviceId: deviceInfo.deviceId,
            platform,
            token: deviceInfo.pushToken,
        }).catch((error) => console.warn('push-token register failed', error));
    }, [deviceInfo.deviceId, deviceInfo.pushToken]);

    return <DeviceContext.Provider value={deviceInfo}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
    const context = useContext(DeviceContext);

    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }

    return context;
}
