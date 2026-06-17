import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';
const deviceModel = Device.modelName ?? 'Unknown device';
const osName = Device.osName ?? Platform.OS;
const userAgent =
    `EmitSignal/${appVersion} (${deviceModel}; ${osName} ${Device.osVersion ?? ''})`.trim();

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:5001',
    fetchOptions: {
        onRequest: (context) => {
            context.headers.set('User-Agent', userAgent);

            return context;
        },
    },
    plugins: [
        expoClient({
            storage: SecureStore,
        }),
        emailOTPClient(),
        inferAdditionalFields({ user: { onboarded: { type: 'boolean' } } }),
    ],
});
