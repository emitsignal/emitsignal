import { useLocalSearchParams, router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { useState, useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MessageList } from "@/components/message-list";
import { api } from "@notify/convex";
import { Colors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

function Header({ topicName }: { topicName: string }) {
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
                        name="chevron.left"
                        size={24}
                        color={colors.icon}
                    />
                </TouchableOpacity>

                <ThemedView style={styles.topicInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.topicName}>
                        {topicName}
                    </ThemedText>
                    <ThemedText style={styles.topicSubtitle}>
                        Daily backup status notifications
                    </ThemedText>
                </ThemedView>

                <TouchableOpacity style={styles.headerAction}>
                    <IconSymbol
                        name="ellipsis.circle"
                        size={24}
                        color={colors.icon}
                    />
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

export default function TopicListenerScreen() {
    const { topic } = useLocalSearchParams<{ topic: string }>();
    const colorScheme = useColorScheme();
    const [refreshing, setRefreshing] = useState(false);

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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (!topicData && messages === undefined) {
        return (
            <ThemedView style={styles.container}>
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
                        The topic "{topic}" doesn't exist
                    </ThemedText>
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Header topicName={topicData.displayName || topicData.name} />
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
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: UI.spacing.lg,
        gap: UI.spacing.md,
    },
    backButton: {
        padding: UI.spacing.xs,
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
