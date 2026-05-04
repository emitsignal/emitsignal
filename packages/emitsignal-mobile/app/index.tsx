import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { W } from "@/constants/theme";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function Index() {
    const { isLoading, isOnboardingComplete } = useOnboarding();

    useEffect(() => {
        if (isLoading) return;
        if (isOnboardingComplete) {
            router.replace("/(tabs)");
        } else {
            router.replace("/auth");
        }
    }, [isLoading, isOnboardingComplete]);

    return <View style={{ backgroundColor: W.bg, flex: 1 }} />;
}
