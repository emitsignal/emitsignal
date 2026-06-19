import { ExpoConfig } from 'expo/config';

import { version } from './package.json';

const config: ExpoConfig = {
    android: {
        adaptiveIcon: {
            backgroundColor: '#14091e',
            backgroundImage: './assets/images/android-icon-background.png',
            foregroundImage: './assets/images/android-icon-foreground.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
        package: 'com.emitsignal',
        predictiveBackGestureEnabled: false,
    },
    backgroundColor: '#0f0a1a',
    experiments: {
        reactCompiler: true,
        typedRoutes: false,
    },
    extra: {
        eas: {
            projectId: '1424f0ee-b60d-4b18-b09c-4a3bd2740ae8',
        },
        router: {},
    },
    icon: './assets/images/icon.png',
    ios: {
        bundleIdentifier: 'com.emitsignal',
        icon: './assets/emitsignal-ios.icon',
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
        supportsTablet: true,
    },
    name: 'EmitSignal',
    orientation: 'portrait',
    owner: 'kevenleone',
    plugins: [
        'expo-font',
        'expo-notifications',
        'expo-router',
        'expo-secure-store',
        'expo-web-browser',
        [
            'expo-splash-screen',
            {
                backgroundColor: '#0f0a1a',
                dark: {
                    backgroundColor: '#0f0a1a',
                },
                image: './assets/images/splash-icon.png',
                imageWidth: 160,
                resizeMode: 'contain',
            },
        ],
    ],
    scheme: 'mobile',
    slug: 'emit-signal',
    userInterfaceStyle: 'automatic',
    version,
    web: {
        favicon: './assets/images/favicon.png',
        output: 'static',
    },
};

export default config;
