import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { AnimatedSplash } from '@/components/animated-splash';
import { palettes } from '@/constants/theme';
import { DebugSectionsProvider } from '@/ctx/debug-sections';
import { DeviceProvider } from '@/ctx/device';
import { FeedStyleProvider } from '@/ctx/feed-style';
import { SessionProvider } from '@/ctx/session';
import { ThemeProvider } from '@/ctx/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useForegroundNotifications } from '@/hooks/use-foreground-notifications';
import { usePalette } from '@/hooks/use-palette';
import { useWidgetSync } from '@/hooks/use-widget-sync';
import { queryClient } from '@/lib/query-client';
import { setupQuerySync } from '@/lib/query-online';

setupQuerySync();

// Keep the native splash up until the JS bundle is ready, then hand off to the
// in-app animated intro. Both share the same scheme background so the swap is seamless.
SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true' && process.env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: Constants.expoConfig?.extra?.appMode ?? 'production',
        tracesSampleRate: 0.1,
    });
}

function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <FeedStyleProvider>
                    <DebugSectionsProvider>
                        <SessionProvider>
                            <DeviceProvider>
                                <RootLayoutContent />
                            </DeviceProvider>
                        </SessionProvider>
                    </DebugSectionsProvider>
                </FeedStyleProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

function RootLayoutContent() {
    useForegroundNotifications();
    useWidgetSync();

    const colorScheme = useColorScheme();
    const palette = usePalette();
    const [introDone, setIntroDone] = useState(false);

    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        SystemUI.setBackgroundColorAsync(palettes[colorScheme].bg);
    }, [colorScheme]);

    // Use the active palette as the navigation theme background. The patched
    // expo-router forwards this to the native stack container (ScreenStack's
    // nativeContainerStyle), so the interactive back-swipe no longer flashes the
    // unpainted white container behind the screens.
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    const navigationTheme = {
        ...baseTheme,
        colors: { ...baseTheme.colors, background: palette.bg, card: palette.bg },
    };

    return (
        <NavigationThemeProvider value={navigationTheme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="topics" />
                <Stack.Screen name="messages" />
                <Stack.Screen
                    name="modal"
                    options={{
                        contentStyle: { backgroundColor: palette.bg },
                        presentation: 'formSheet',
                        sheetCornerRadius: 16,
                        sheetGrabberVisible: true,
                    }}
                />
                <Stack.Screen
                    name="image-viewer"
                    options={{
                        animation: 'slide_from_bottom',
                        presentation: 'transparentModal',
                    }}
                />
            </Stack>

            {introDone ? null : <AnimatedSplash onFinish={() => setIntroDone(true)} />}
        </NavigationThemeProvider>
    );
}

export default Sentry.wrap(RootLayout);
