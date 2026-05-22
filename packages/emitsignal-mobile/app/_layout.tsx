import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DebugSectionsProvider } from '@/ctx/debug-sections';
import { DeviceProvider } from '@/ctx/device';
import { SessionProvider } from '@/ctx/session';
import { ThemeProvider } from '@/ctx/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useForegroundNotifications } from '@/hooks/use-foreground-notifications';

export default function RootLayout() {
    return (
        <ThemeProvider>
            <DebugSectionsProvider>
                <SessionProvider>
                    <DeviceProvider>
                        <RootLayoutContent />
                    </DeviceProvider>
                </SessionProvider>
            </DebugSectionsProvider>
        </ThemeProvider>
    );
}

function RootLayoutContent() {
    useForegroundNotifications();

    const colorScheme = useColorScheme();

    return (
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="topics" />
                <Stack.Screen name="messages" />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="light" />
        </NavigationThemeProvider>
    );
}
