import { ExpoConfig } from 'expo/config';

import { version } from './package.json';

const appleTeamId = process.env.APPLE_TEAM_ID;
const appMode = process.env.APP_MODE;
const projectId = process.env.PROJECT_ID;

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
            iosIcon: './assets/emitsignal-preview-ios.icon',
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

const appGroup = `group.${bundleIdentifier}`;

const config: ExpoConfig = {
    android: {
        adaptiveIcon: {
            backgroundColor: '#08080a',
            backgroundImage: './assets/images/android-icon-background.png',
            foregroundImage: './assets/images/android-icon-foreground.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
        package: bundleIdentifier,
        predictiveBackGestureEnabled: false,
    },
    backgroundColor: '#08080a',
    experiments: {
        reactCompiler: true,
        typedRoutes: false,
    },
    extra: {
        appGroup,
        appMode: appMode ?? 'production',
        eas: {
            projectId,
        },
        router: {},
    },
    icon: './assets/images/icon.png',
    ios: {
        appleTeamId,
        bundleIdentifier,
        entitlements: {
            'com.apple.security.application-groups': [appGroup],
        },
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
        '@bacons/apple-targets',
        '@sentry/react-native/expo',
        'expo-apple-authentication',
        'expo-font',
        'expo-notifications',
        'expo-router',
        'expo-secure-store',
        'expo-web-browser',
        [
            'expo-splash-screen',
            {
                backgroundColor: '#08080a',
                dark: {
                    backgroundColor: '#08080a',
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
