import { ExpoConfig } from 'expo/config';

import { version } from './package.json';

const appMode = process.env.APP_MODE;

const projectId = '1424f0ee-b60d-4b18-b09c-4a3bd2740ae8';

function getProjectConfig() {
    if (appMode === 'development') {
        return {
            bundleIdentifier: 'com.emitsignal.development',
            iosIcon: './assets/emitsignal-development-ios.icon',
            name: 'EmitSignal (Development)',
            scheme: 'emitsignal-development',
        };
    }

    if (appMode === 'preview') {
        return {
            bundleIdentifier: 'com.emitsignal.preview',
            iosIcon: './assets/emitsignal-development-ios.icon',
            name: 'EmitSignal (Preview)',
            scheme: 'emitsignal-preview',
        };
    }

    return {
        bundleIdentifier: 'com.emitsignal',
        iosIcon: './assets/emitsignal-ios.icon',
        name: 'EmitSignal',
        scheme: 'emitsignal',
    };
}

const { bundleIdentifier, iosIcon, name, scheme } = getProjectConfig();

const config: ExpoConfig = {
    android: {
        adaptiveIcon: {
            backgroundColor: '#14091e',
            backgroundImage: './assets/images/android-icon-background.png',
            foregroundImage: './assets/images/android-icon-foreground.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
        package: bundleIdentifier,
        predictiveBackGestureEnabled: false,
    },
    backgroundColor: '#0f0a1a',
    experiments: {
        reactCompiler: true,
        typedRoutes: false,
    },
    extra: {
        appMode: appMode ?? 'production',
        eas: {
            projectId,
        },
        router: {},
    },
    icon: './assets/images/icon.png',
    ios: {
        bundleIdentifier,
        icon: iosIcon,
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
        supportsTablet: true,
        usesAppleSignIn: true,
    },
    name,
    orientation: 'portrait',
    owner: 'kevenleone',
    plugins: [
        'expo-apple-authentication',
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
    runtimeVersion: {
        policy: 'appVersion',
    },
    scheme,
    slug: 'emit-signal',
    updates: {
        url: `https://u.expo.dev/${projectId}`,
    },
    userInterfaceStyle: 'automatic',
    version,
    web: {
        favicon: './assets/images/favicon.png',
        output: 'static',
    },
};

export default config;
