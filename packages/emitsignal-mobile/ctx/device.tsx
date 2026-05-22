import { createContext, type ReactNode, useContext } from 'react';

import { useDeviceInfo } from '@/hooks/use-device-info';

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

    return <DeviceContext.Provider value={deviceInfo}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
    const context = useContext(DeviceContext);

    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }

    return context;
}
