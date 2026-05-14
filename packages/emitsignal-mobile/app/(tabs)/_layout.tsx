import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { W } from '@/constants/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: W.violet,
                tabBarButton: HapticTab,
                tabBarInactiveTintColor: W.fgDim,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                },
                tabBarStyle: {
                    backgroundColor: W.bg,
                    borderTopColor: W.bgLine,
                    borderTopWidth: StyleSheet.hairlineWidth,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => <IconSymbol color={color} name="bell" size={22} />,
                    title: 'Feed',
                }}
            />
            <Tabs.Screen
                name="channels"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol color={color} name="square.grid.2x2" size={22} />
                    ),
                    title: 'Channels',
                }}
            />
            <Tabs.Screen
                name="publish"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol color={color} name="terminal" size={22} />
                    ),
                    title: 'Publish',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ color }) => <IconSymbol color={color} name="gear" size={22} />,
                    title: 'Settings',
                }}
            />
        </Tabs>
    );
}
