import { StyleSheet } from "react-native";
import { SubscribeModalContent } from "@/components/subscribe-modal";
import { ThemedView } from "@/components/themed-view";
import { router, Stack } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@notify/convex";
import { useDevice } from "@/ctx/device";
import { useState } from "react";

export default function ModalScreen() {
    const { deviceId, pushToken } = useDevice();
    const subscribeToTopic = useMutation(api.mutations.subscriptions.subscribeToTopic);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async (topicName: string, description: string, instantDelivery: boolean) => {
        if (!deviceId) {
            console.error("Device ID not available");
            return;
        }

        setIsLoading(true);
        try {
            await subscribeToTopic({
                topicName,
                deviceId,
                pushToken: pushToken || undefined,
            });
            router.back();
        } catch (error) {
            console.error("Failed to subscribe:", error);
            // TODO: Show error toast
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        router.back();
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ThemedView style={styles.container}>
                <SubscribeModalContent
                    onSubscribe={handleSubscribe}
                    onClose={handleClose}
                    isLoading={isLoading}
                />
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
