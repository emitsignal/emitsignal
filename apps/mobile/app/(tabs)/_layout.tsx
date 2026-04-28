import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { W } from "@/constants/theme";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: W.violet,
                tabBarInactiveTintColor: W.fgDim,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: W.bg,
                    borderTopColor: W.bgLine,
                    borderTopWidth: StyleSheet.hairlineWidth,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "500",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={22} name="bell" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="channels"
                options={{
                    title: "Channels",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={22}
                            name="square.grid.2x2"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="publish"
                options={{
                    title: "Publish",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={22}
                            name="terminal"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={22} name="gear" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
