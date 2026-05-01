import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "@notify_device_id";
const PUSH_TOKEN_KEY = "@notify_push_token";

// Generate a UUID v4
function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export interface DeviceInfo {
    deviceId: string | null;
    pushToken: string | null;
    isLoading: boolean;
    error: Error | null;
}

export function useDeviceInfo() {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        deviceId: null,
        pushToken: null,
        isLoading: true,
        error: null,
    });

    // Initialize device ID
    const initializeDeviceId = useCallback(async () => {
        try {
            let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

            if (!deviceId) {
                deviceId = generateUUID();
                await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
            }

            return deviceId;
        } catch (error) {
            console.error("Error initializing device ID:", error);
            throw error;
        }
    }, []);

    // Register for push notifications
    const registerPushNotifications = useCallback(async () => {
        try {
            if (!Device.isDevice) {
                console.log("Push notifications not available on simulator");
                return null;
            }

            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } =
                    await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.log("Push notification permission denied");
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
            });

            const token = tokenData.data;
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

            // Configure notification handler
            if (Platform.OS === "android") {
                Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }

            return token;
        } catch (error) {
            console.error("Error registering push notifications:", error);
            return null;
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            try {
                const deviceId = await initializeDeviceId();
                const pushToken = await registerPushNotifications();

                setDeviceInfo({
                    deviceId,
                    pushToken,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                setDeviceInfo({
                    deviceId: null,
                    pushToken: null,
                    isLoading: false,
                    error:
                        error instanceof Error
                            ? error
                            : new Error("Unknown error"),
                });
            }
        };

        init();
    }, [initializeDeviceId, registerPushNotifications]);

    // Refresh push token
    const refreshPushToken = useCallback(async () => {
        try {
            const pushToken = await registerPushNotifications();
            setDeviceInfo((prev) => ({
                ...prev,
                pushToken,
            }));
            return pushToken;
        } catch (error) {
            console.error("Error refreshing push token:", error);
            return null;
        }
    }, [registerPushNotifications]);

    return {
        ...deviceInfo,
        refreshPushToken,
    };
}
