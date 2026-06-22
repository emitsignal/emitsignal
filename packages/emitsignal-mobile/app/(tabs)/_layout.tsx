import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';

import { useSession } from '@/ctx/session';
import { useOnboarding } from '@/hooks/use-onboarding';
import { usePalette } from '@/hooks/use-palette';

export default function TabLayout() {
    const { isLoading: onboardingLoading, isOnboardingComplete } = useOnboarding();
    const { loading: sessionLoading, user } = useSession();
    const palette = usePalette();

    const isSignedIn = !!user?.id;
    const isAllowed = isOnboardingComplete || isSignedIn;
    const isLoading = onboardingLoading || sessionLoading;

    useEffect(() => {
        if (!isLoading && !isAllowed) {
            router.replace('/auth');
        }
    }, [isLoading, isAllowed]);

    if (isLoading || !isAllowed) {
        return null;
    }

    return (
        <NativeTabs
            backgroundColor={palette.bg}
            iconColor={palette.fgDim}
            indicatorColor={palette.bgChip}
            tintColor={palette.violet}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon md="notifications" sf="bell" />
                <NativeTabs.Trigger.Label>Feed</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="channels">
                <NativeTabs.Trigger.Icon md="grid_view" sf="square.grid.2x2" />
                <NativeTabs.Trigger.Label>Channels</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="publish">
                <NativeTabs.Trigger.Icon md="terminal" sf="terminal" />
                <NativeTabs.Trigger.Label>Publish</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <NativeTabs.Trigger.Icon md="settings" sf="gear" />
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
