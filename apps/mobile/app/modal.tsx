import { StyleSheet } from "react-native";
import { SubscribeModalContent } from "@/components/subscribe-modal";
import { ThemedView } from "@/components/themed-view";
import { router, Stack } from "expo-router";

export default function ModalScreen() {
    const handleSubscribe = (topicName: string, description: string) => {
        console.log("Subscribe to topic:", topicName, description);
        // TODO: Implement actual subscription logic with Convex
        router.back();
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
