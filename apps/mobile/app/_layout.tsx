import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeProvider } from "@/ctx/theme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export const unstable_settings = {
    anchor: "(tabs)",
};

function RootLayoutContent() {
    const colorScheme = useColorScheme();

    return (
        <NavigationThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                <Stack.Screen name="topics" options={{ headerShown: false }} />

                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </NavigationThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <ConvexProvider client={convex}>
            <ThemeProvider>
                <RootLayoutContent />
            </ThemeProvider>
        </ConvexProvider>
    );
}
