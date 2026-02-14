import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { Link } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { api } from "@notify/convex";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Topic {
    _id: string;
    name: string;
    displayName: string;
    description?: string;
    isPublic: boolean;
    createdAt: number;
}

function TopicCard({ topic }: { topic: Topic }) {
    const colorScheme = useColorScheme();

    return (
        <Link href={`/topics/${topic.name}`} asChild>
            <TouchableOpacity>
                <ThemedView style={styles.topicCard}>
                    <ThemedView style={styles.topicHeader}>
                        <ThemedText type="defaultSemiBold">
                            #{topic.name}
                        </ThemedText>
                        {!topic.isPublic && (
                            <IconSymbol
                                name="lock.fill"
                                size={14}
                                color={
                                    colorScheme === "dark"
                                        ? Colors.dark.icon
                                        : Colors.light.icon
                                }
                            />
                        )}
                    </ThemedView>
                    <ThemedText style={styles.displayName}>
                        {topic.displayName}
                    </ThemedText>
                    {topic.description && (
                        <ThemedText
                            style={styles.description}
                            numberOfLines={2}
                        >
                            {topic.description}
                        </ThemedText>
                    )}
                    <ThemedView style={styles.topicMeta}>
                        <ThemedText style={styles.metaText}>
                            {topic.isPublic ? "Public" : "Private"}
                        </ThemedText>
                    </ThemedView>
                </ThemedView>
            </TouchableOpacity>
        </Link>
    );
}

function EmptyState() {
    return (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="tray" size={48} color="#999" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
                No topics yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Topics will appear here when they're created
            </ThemedText>
        </ThemedView>
    );
}

export default function TopicsScreen() {
    const topics = useQuery(api.queries.topics.list, {
        // isPublic: true,
        limit: 50,
    });

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Topics</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Browse and listen to message topics
                </ThemedText>
            </ThemedView>

            <FlatList
                data={topics || []}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <TopicCard topic={item as Topic} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
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
    },
    subtitle: {
        marginTop: 4,
        opacity: 0.6,
    },
    listContainer: {
        padding: 16,
        paddingTop: 0,
    },
    topicCard: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e5e5",
    },
    topicHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    displayName: {
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 8,
    },
    description: {
        fontSize: 12,
        opacity: 0.6,
        marginBottom: 12,
    },
    topicMeta: {
        flexDirection: "row",
    },
    metaText: {
        fontSize: 12,
        opacity: 0.5,
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
