import { createContext, useContext, ReactNode } from "react";
import { useDeviceInfo } from "@/hooks/use-device-info";

interface DeviceContextType {
    deviceId: string | null;
    pushToken: string | null;
    isLoading: boolean;
    error: Error | null;
    refreshPushToken: () => Promise<string | null>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
    const deviceInfo = useDeviceInfo();

    return (
        <DeviceContext.Provider value={deviceInfo}>
            {children}
        </DeviceContext.Provider>
    );
}

export function useDevice() {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error("useDevice must be used within a DeviceProvider");
    }
    return context;
}
