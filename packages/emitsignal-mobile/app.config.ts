import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    android: {
        adaptiveIcon: {
            backgroundColor: '#14091e',
            backgroundImage: './assets/images/android-icon-background.png',
            foregroundImage: './assets/images/android-icon-foreground.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        edgeToEdgeEnabled: true,
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
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
        supportsTablet: true,
    },
    name: 'EmitSignal',
    newArchEnabled: true,
    orientation: 'portrait',
    owner: 'kevenleone',
    plugins: [
        'expo-router',
        'expo-secure-store',
        [
            'expo-splash-screen',
            {
                backgroundColor: '#ffffff',
                dark: {
                    backgroundColor: '#000000',
                },
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
            },
        ],
    ],
    scheme: 'mobile',
    slug: 'emit-signal',
    userInterfaceStyle: 'automatic',
    version: '1.0.0',
    web: {
        favicon: './assets/images/favicon.png',
        output: 'static',
    },
};

export default config;
