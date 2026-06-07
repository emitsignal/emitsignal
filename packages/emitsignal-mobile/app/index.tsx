import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { W } from '@/constants/theme';
import { useSession } from '@/ctx/session';
import { useOnboarding } from '@/hooks/use-onboarding';

export default function Index() {
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

    return <View style={{ backgroundColor: W.bg, flex: 1 }} />;
}
