import ExpoConstants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface AppIdentity {
    appId?: string;
    deviceName?: string;
    platform: 'android' | 'ios' | 'web';
}

export function getAppIdentity(): AppIdentity {
    const config = ExpoConstants.expoConfig;

    return {
        appId: config?.ios?.bundleIdentifier ?? config?.android?.package,
        deviceName: Device.modelName ?? Device.deviceName ?? undefined,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    };
}
