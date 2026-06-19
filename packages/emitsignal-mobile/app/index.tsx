import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useSession } from '@/ctx/session';
import { useOnboarding } from '@/hooks/use-onboarding';
import { usePalette } from '@/hooks/use-palette';

export default function Index() {
    const palette = usePalette();
    const { isLoading: onboardingLoading, isOnboardingComplete } = useOnboarding();
    const { loading: sessionLoading, user } = useSession();
    const isSignedIn = !!user;

    useEffect(() => {
        if (onboardingLoading || sessionLoading) {
            return;
        }

        if (isSignedIn || isOnboardingComplete) {
            router.replace('/(tabs)');
        } else {
            router.replace('/auth');
        }
    }, [onboardingLoading, sessionLoading, isSignedIn, isOnboardingComplete]);

    return <View style={{ backgroundColor: palette.bg, flex: 1 }} />;
}
