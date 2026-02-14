import React from "react";
import { FlatList, StyleSheet, View, type ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Colors, PriorityColors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface Message {
    _id: string;
    title: string;
    body: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    createdAt: number;
}

interface MessageListProps {
    messages: Message[];
    style?: ViewStyle;
    ListEmptyComponent?: React.ReactElement;
}

const priorityLabels: Record<number, string> = {
    1: "min",
    2: "low",
    3: "default",
    4: "high",
    5: "urgent",
};

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return "Today";
    }

    if (isYesterday) {
        return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

function MessageItem({ message }: { message: Message }) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
    const priorityColor = PriorityColors[message.priority];

    return (
        <ThemedView
            style={[
                styles.messageCard,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                },
                colorScheme === "light" && UI.shadow.small,
            ]}
        >
            <View style={styles.messageHeader}>
                <ThemedText type="defaultSemiBold" style={styles.title}>
                    {message.title}
                </ThemedText>
                <ThemedText style={styles.timeText}>
                    {formatTime(message.createdAt)}
                </ThemedText>
            </View>

            <ThemedText style={styles.body} numberOfLines={3}>
                {message.body}
            </ThemedText>

            <View style={styles.messageFooter}>
                <View style={styles.tagsContainer}>
                    {message.tags.slice(0, 3).map((tag, index) => (
                        <View
                            key={index}
                            style={[
                                styles.tag,
                                {
                                    backgroundColor:
                                        colorScheme === "dark"
                                            ? "#3a3a3a"
                                            : "#f0f0f0",
                                },
                            ]}
                        >
                            <ThemedText style={styles.tagText}>
                                {tag}
                            </ThemedText>
                        </View>
                    ))}
                    {message.tags.length > 3 && (
                        <ThemedText style={styles.moreTagsText}>
                            +{message.tags.length - 3}
                        </ThemedText>
                    )}
                </View>

                <View style={styles.metaContainer}>
                    <View
                        style={[
                            styles.priorityBadge,
                            { backgroundColor: priorityColor },
                        ]}
                    >
                        <ThemedText style={styles.priorityText}>
                            {priorityLabels[message.priority]}
                        </ThemedText>
                    </View>
                </View>
            </View>
        </ThemedView>
    );
}

export function MessageList({
    messages,
    style,
    ListEmptyComponent,
}: MessageListProps) {
    const colorScheme = useColorScheme();

    return (
        <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <MessageItem message={item} />}
            contentContainerStyle={[styles.listContainer, style]}
            ListEmptyComponent={ListEmptyComponent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: UI.spacing.lg,
        paddingBottom: 100,
    },
    messageCard: {
        padding: UI.spacing.md,
        marginBottom: UI.spacing.md,
        borderRadius: UI.borderRadius.medium,
        borderWidth: 1,
    },
    messageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: UI.spacing.sm,
    },
    title: {
        flex: 1,
        marginRight: UI.spacing.sm,
        fontSize: 16,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.5,
    },
    body: {
        marginBottom: UI.spacing.md,
        lineHeight: 20,
        opacity: 0.8,
    },
    messageFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: UI.spacing.xs,
        flex: 1,
        marginRight: UI.spacing.sm,
    },
    tag: {
        paddingHorizontal: UI.spacing.sm,
        paddingVertical: 4,
        borderRadius: UI.borderRadius.small,
    },
    tagText: {
        fontSize: 11,
        opacity: 0.7,
    },
    moreTagsText: {
        fontSize: 11,
        opacity: 0.5,
        paddingHorizontal: UI.spacing.xs,
    },
    metaContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.sm,
    },
    priorityBadge: {
        paddingHorizontal: UI.spacing.sm,
        paddingVertical: 4,
        borderRadius: UI.borderRadius.small,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#ffffff",
    },
});
