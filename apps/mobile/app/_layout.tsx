import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { useColorScheme } from "@/hooks/use-color-scheme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ConvexProvider client={convex}>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <Stack>
                    <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name="topics"
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name="modal"
                        options={{ presentation: "modal", title: "Modal" }}
                    />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </ConvexProvider>
    );
}
