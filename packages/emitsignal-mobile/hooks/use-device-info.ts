import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@notify_device_id';
const PUSH_TOKEN_KEY = '@notify_push_token';

export interface DeviceInfo {
    deviceId: null | string;
    error: Error | null;
    isLoading: boolean;
    pushToken: null | string;
}

export function useDeviceInfo() {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        deviceId: null,
        error: null,
        isLoading: true,
        pushToken: null,
    });

    // Initialize device ID
    const initializeDeviceId = useCallback(async () => {
        try {
            let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

            if (!deviceId) {
                deviceId = crypto.randomUUID();

                await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
            }

            return deviceId;
        } catch (error) {
            console.error('Error initializing device ID:', error);

            throw error;
        }
    }, []);

    // Register for push notifications
    const registerPushNotifications = useCallback(async () => {
        try {
            if (!Device.isDevice) {
                console.log('Push notifications not available on simulator');
                return null;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Push notification permission denied');
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
            });

            const token = tokenData.data;
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

            // Configure notification handler
            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    importance: Notifications.AndroidImportance.MAX,
                    lightColor: '#FF231F7C',
                    name: 'default',
                    vibrationPattern: [0, 250, 250, 250],
                });
            }

            return token;
        } catch (error) {
            console.error('Error registering push notifications:', error);
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
                    error: null,
                    isLoading: false,
                    pushToken,
                });
            } catch (error) {
                setDeviceInfo({
                    deviceId: null,
                    error: error instanceof Error ? error : new Error('Unknown error'),
                    isLoading: false,
                    pushToken: null,
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
            console.error('Error refreshing push token:', error);
            return null;
        }
    }, [registerPushNotifications]);

    return {
        ...deviceInfo,
        refreshPushToken,
    };
}
