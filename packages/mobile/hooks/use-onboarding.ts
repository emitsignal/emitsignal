import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "@whinsper_onboarding_complete";

export function useOnboarding() {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((value) => {
                setIsOnboardingComplete(value === "true");
            })
            .catch(() => {
                // Treat error as incomplete — safe default
            })
            .finally(() => setIsLoading(false));
    }, []);

    const markOnboardingComplete = useCallback(async () => {
        await AsyncStorage.setItem(KEY, "true");
        setIsOnboardingComplete(true);
    }, []);

    return { isLoading, isOnboardingComplete, markOnboardingComplete };
}
