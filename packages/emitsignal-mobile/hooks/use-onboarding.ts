import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { authClient } from '@/lib/auth-client';

const KEY = '@emitsignal/onboarding_complete';

interface OnboardingState {
    isLoading: boolean;
    isOnboardingComplete: boolean;
}

let state: OnboardingState = { isLoading: true, isOnboardingComplete: false };
let loadStarted = false;
const listeners = new Set<() => void>();

export async function clearOnboardingComplete(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
    setState({ isOnboardingComplete: false });
}

export function useOnboarding(): {
    markOnboardingComplete: () => Promise<void>;
} & OnboardingState {
    const { isLoading, isOnboardingComplete } = useSyncExternalStore(subscribe, getSnapshot);

    return { isLoading, isOnboardingComplete, markOnboardingComplete };
}

function getSnapshot(): OnboardingState {
    return state;
}

async function markOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(KEY, 'true');
    setState({ isOnboardingComplete: true });

    // Persist to the account so it syncs across devices. No-ops for anonymous
    // devices, where there is no session to update.
    try {
        await authClient.updateUser({ onboarded: true });
    } catch {
        // Anonymous / offline — the local flag above is the source of truth.
    }
}

function setState(next: Partial<OnboardingState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    if (!loadStarted) {
        loadStarted = true;

        AsyncStorage.getItem(KEY)
            .then((value) => setState({ isLoading: false, isOnboardingComplete: value === 'true' }))
            .catch(() => setState({ isLoading: false }));
    }

    return () => {
        listeners.delete(listener);
    };
}
