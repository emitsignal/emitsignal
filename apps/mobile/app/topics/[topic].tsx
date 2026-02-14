import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { useState, useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MessageList } from "@/components/message-list";
import { api } from "@notify/convex";
import { Colors } from "@/constants/theme";
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
    return (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="bell.slash" size={48} color="#999" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
                No messages yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Waiting for messages in #{topicName}
            </ThemedText>
        </ThemedView>
    );
}

function Header({ topicName }: { topicName: string }) {
    const colorScheme = useColorScheme();

    return (
        <ThemedView style={styles.header}>
            <ThemedView
                style={[
                    styles.topicBadge,
                    {
                        backgroundColor:
                            colorScheme === "dark"
                                ? Colors.dark.tint
                                : Colors.light.tint,
                    },
                ]}
            >
                <ThemedText style={styles.topicText}>#{topicName}</ThemedText>
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
        return (
            <ThemedView style={styles.container}>
                <Header topicName={topic} />
                <ThemedView style={styles.centered}>
                    <IconSymbol
                        name="exclamationmark.triangle"
                        size={48}
                        color="#999"
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
            <Header topicName={topicData.name} />
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
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
    },
    topicBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    topicText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        marginTop: 100,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: "center",
        opacity: 0.6,
    },
});
