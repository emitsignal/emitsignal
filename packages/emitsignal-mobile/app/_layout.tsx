import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AnimatedSplash } from '@/components/animated-splash';
import { W } from '@/constants/theme';
import { DebugSectionsProvider } from '@/ctx/debug-sections';
import { DeviceProvider } from '@/ctx/device';
import { FeedStyleProvider } from '@/ctx/feed-style';
import { SessionProvider } from '@/ctx/session';
import { ThemeProvider } from '@/ctx/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useForegroundNotifications } from '@/hooks/use-foreground-notifications';
import { queryClient } from '@/lib/query-client';
import { setupQuerySync } from '@/lib/query-online';

setupQuerySync();

// Keep the native splash up until the JS bundle is ready, then hand off to the
// in-app animated intro. Both share the #0f0a1a background so the swap is seamless.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

    const colorScheme = useColorScheme();
    const [introDone, setIntroDone] = useState(false);

    useEffect(() => {
        SystemUI.setBackgroundColorAsync(W.bg);
        SplashScreen.hideAsync();
    }, []);

    return (
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="topics" />
                <Stack.Screen name="messages" />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen
                    name="image-viewer"
                    options={{
                        animation: 'slide_from_bottom',
                        presentation: 'transparentModal',
                    }}
                />
            </Stack>
            {introDone ? null : <AnimatedSplash onFinish={() => setIntroDone(true)} />}
            <StatusBar style="light" />
        </NavigationThemeProvider>
    );
}
