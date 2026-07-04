import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { authClient } from '@/lib/auth-client';

const KEY = '@emitsignal/onboarding_complete';

export async function clearOnboardingComplete() {
    await AsyncStorage.removeItem(KEY);
}

export function useOnboarding() {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((value) => {
                setIsOnboardingComplete(value === 'true');
            })
            .catch(() => {
                // Treat error as incomplete — safe default
            })
            .finally(() => setIsLoading(false));
    }, []);

    const markOnboardingComplete = useCallback(async () => {
        await AsyncStorage.setItem(KEY, 'true');
        setIsOnboardingComplete(true);

        // Persist to the account so it syncs across devices. No-ops for anonymous
        // devices, where there is no session to update.
        try {
            await authClient.updateUser({ onboarded: true });
        } catch {
            // Anonymous / offline — the local flag above is the source of truth.
        }
    }, []);

    return { isLoading, isOnboardingComplete, markOnboardingComplete };
}
