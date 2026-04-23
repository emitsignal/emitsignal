import { useLocalSearchParams, router, Stack } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
import { useQuery } from "convex/react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MessageList } from "@/components/message-list";
import { api } from "@notify/convex";
import { Colors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Message {
    _id: string;
    title: string;
    body: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    createdAt: number;
}

function EmptyState({ topicName }: { topicName: string }) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="bell.slash" size={64} color={colors.icon} />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
                No messages yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Waiting for messages in {topicName}
            </ThemedText>
        </ThemedView>
    );
}

function Header({
    topicName,
    description,
}: {
    topicName: string;
    description?: string;
}) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <ThemedView
            style={[styles.header, { borderBottomColor: colors.border }]}
        >
            <ThemedView style={styles.headerContent}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <IconSymbol
                        name="arrow.left"
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <View
                    style={[
                        styles.topicIcon,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <IconSymbol name="folder" size={24} color={colors.tint} />
                </View>

                <View style={styles.topicInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.topicName}>
                        {topicName}
                    </ThemedText>
                    {description && (
                        <ThemedText
                            style={styles.topicSubtitle}
                            numberOfLines={1}
                        >
                            {description}
                        </ThemedText>
                    )}
                </View>

                <TouchableOpacity style={styles.headerAction}>
                    <IconSymbol name="ellipsis" size={24} color={colors.text} />
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

export default function TopicListenerScreen() {
    const { topic } = useLocalSearchParams<{ topic: string }>();
    const colorScheme = useColorScheme();

    const topicData = useQuery(api.queries.topics.getByName, {
        name: topic,
    });

    const messages = useQuery(
        api.queries.topics.getMessages,
        topicData?._id
            ? {
                  topicId: topicData._id,
                  limit: 50,
              }
            : "skip",
    );

    // Set up native in-app notifications for new messages
    const { detectAndNotify } = useInAppNotifications({
        topicId: topicData?._id,
        topicName: topicData?.displayName || topicData?.name || topic,
    });

    // Trigger notification when new messages arrive
    useEffect(() => {
        detectAndNotify(messages as Message[] | undefined);
    }, [messages, detectAndNotify]);

    if (!topicData && messages === undefined) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <Header topicName={topic} />
                <ThemedView style={styles.centered}>
                    <ThemedText>Loading...</ThemedText>
                </ThemedView>
            </ThemedView>
        );
    }

    if (!topicData) {
        const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <Header topicName={topic} />
                <ThemedView style={styles.centered}>
                    <IconSymbol
                        name="exclamationmark.triangle"
                        size={64}
                        color={colors.icon}
                    />
                    <ThemedText type="subtitle" style={styles.emptyTitle}>
                        Topic not found
                    </ThemedText>
                    <ThemedText style={styles.emptyText}>
                        The topic &quot;{topic}&quot; doesn&apos;t exist
                    </ThemedText>
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Header
                topicName={topicData.displayName || topicData.name}
                description={topicData.description}
            />
            <MessageList
                messages={(messages || []) as Message[]}
                ListEmptyComponent={<EmptyState topicName={topicData.name} />}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: UI.spacing.md,
        borderBottomWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: UI.spacing.md,
        gap: UI.spacing.md,
    },
    backButton: {
        padding: UI.spacing.xs,
    },
    topicIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    topicInfo: {
        flex: 1,
    },
    topicName: {
        fontSize: 18,
    },
    topicSubtitle: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 2,
    },
    headerAction: {
        padding: UI.spacing.xs,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: UI.spacing.xxl,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: UI.spacing.xxl,
        marginTop: 100,
    },
    emptyTitle: {
        marginTop: UI.spacing.lg,
        marginBottom: UI.spacing.sm,
    },
    emptyText: {
        textAlign: "center",
        opacity: 0.6,
    },
});
