import {
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    View,
} from "react-native";
import { useQuery } from "convex/react";
import { Link, router } from "expo-router";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FloatingActionButton } from "@/components/floating-action-button";
import { api } from "@notify/convex";
import { Colors, UI } from "@/constants/theme";
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
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    // Mock notification count - replace with actual data
    const notificationCount = Math.floor(Math.random() * 20);
    const hasNotifications = notificationCount > 0;

    // Mock timestamp - replace with actual last notification time
    const timestamp = "10:21";

    return (
        <Link href={`/topics/${topic.name}`} asChild>
            <TouchableOpacity>
                <ThemedView
                    style={[
                        styles.topicCard,
                        {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.border,
                        },
                        colorScheme === "light" && UI.shadow.small,
                    ]}
                >
                    <View style={styles.topicCardContent}>
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: colors.tint },
                            ]}
                        >
                            <IconSymbol
                                name="bell.fill"
                                size={20}
                                color="#ffffff"
                            />
                        </View>

                        <View style={styles.topicInfo}>
                            <View style={styles.topicHeader}>
                                <ThemedText
                                    type="defaultSemiBold"
                                    style={styles.topicName}
                                >
                                    {topic.displayName || topic.name}
                                </ThemedText>
                                {hasNotifications && (
                                    <ThemedText style={styles.timestamp}>
                                        {timestamp}
                                    </ThemedText>
                                )}
                            </View>

                            <ThemedText
                                style={styles.topicDescription}
                                numberOfLines={1}
                            >
                                {topic.description ||
                                    `${notificationCount} notification${notificationCount !== 1 ? "s" : ""}`}
                            </ThemedText>
                        </View>

                        {hasNotifications && (
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: colors.tint },
                                ]}
                            >
                                <ThemedText style={styles.badgeText}>
                                    {notificationCount}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </ThemedView>
            </TouchableOpacity>
        </Link>
    );
}

function EmptyState() {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="bell" size={64} color={colors.icon} />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
                No subscribed topics
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Tap the + button to subscribe to a topic
            </ThemedText>
        </ThemedView>
    );
}

export default function TopicsScreen() {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
    const [searchQuery, setSearchQuery] = useState("");

    const topics = useQuery(api.queries.topics.list, {
        limit: 50,
    });

    const filteredTopics =
        topics?.filter(
            (topic) =>
                topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                topic.displayName
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        ) || [];

    const handleAddTopic = () => {
        router.push("/modal");
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView
                style={[styles.header, { borderBottomColor: colors.border }]}
            >
                <ThemedView style={styles.headerTop}>
                    <IconSymbol
                        name="bell.badge.fill"
                        size={28}
                        color={colors.tint}
                    />
                    <ThemedText type="title" style={styles.title}>
                        Notify
                    </ThemedText>
                    <TouchableOpacity>
                        <IconSymbol
                            name="magnifyingglass"
                            size={24}
                            color={colors.icon}
                        />
                    </TouchableOpacity>
                </ThemedView>

                <ThemedText style={styles.subtitle}>
                    {topics?.length || 0} subscribed topics
                </ThemedText>
            </ThemedView>

            <FlatList
                data={filteredTopics}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <TopicCard topic={item as Topic} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
            />

            <FloatingActionButton onPress={handleAddTopic} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: UI.spacing.lg,
        paddingTop: 60,
        paddingBottom: UI.spacing.lg,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.sm,
        marginBottom: UI.spacing.xs,
    },
    title: {
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.6,
    },
    searchContainer: {
        marginTop: UI.spacing.md,
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: UI.borderRadius.medium,
        paddingHorizontal: UI.spacing.md,
        paddingVertical: UI.spacing.sm,
        fontSize: 16,
    },
    listContainer: {
        padding: UI.spacing.lg,
        paddingBottom: 100,
    },
    topicCard: {
        marginBottom: UI.spacing.md,
        borderRadius: UI.borderRadius.medium,
        borderWidth: 1,
    },
    topicCardContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: UI.spacing.md,
        gap: UI.spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: UI.borderRadius.full,
        justifyContent: "center",
        alignItems: "center",
    },
    topicInfo: {
        flex: 1,
    },
    topicHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    topicName: {
        fontSize: 16,
    },
    timestamp: {
        fontSize: 12,
        opacity: 0.5,
    },
    topicDescription: {
        fontSize: 14,
        opacity: 0.6,
    },
    badge: {
        minWidth: 24,
        height: 24,
        borderRadius: UI.borderRadius.full,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: UI.spacing.xs,
    },
    badgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "600",
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
