import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Platform } from "react-native";

import { useDeviceInfo } from "@/hooks/use-device-info";
import { api } from "@/lib/api";

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

    // Register push token with the backend whenever it changes
    useEffect(() => {
        if (!deviceInfo.deviceId || !deviceInfo.pushToken) return;
        const platform = (
            Platform.OS === "ios" || Platform.OS === "android"
                ? Platform.OS
                : "web"
        ) as "ios" | "android" | "web";
        api.registerPushToken({
            deviceId: deviceInfo.deviceId,
            token: deviceInfo.pushToken,
            platform,
        }).catch((err) => console.warn("push-token register failed", err));
    }, [deviceInfo.deviceId, deviceInfo.pushToken]);

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
