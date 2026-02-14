import React from "react";
import { FlatList, StyleSheet, View, type ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Colors } from "@/constants/theme";
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

const priorityColors: Record<number, string> = {
    1: "#22c55e", // min - green
    2: "#3b82f6", // low - blue
    3: "#f59e0b", // default - yellow
    4: "#f97316", // high - orange
    5: "#ef4444", // max - red
};

const priorityLabels: Record<number, string> = {
    1: "MIN",
    2: "LOW",
    3: "NORMAL",
    4: "HIGH",
    5: "MAX",
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

    if (isToday) {
        return "Today";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function MessageItem({ message }: { message: Message }) {
    const colorScheme = useColorScheme();
    const priorityColor = priorityColors[message.priority];

    return (
        <View style={styles.messageContainer}>
            <View
                style={[
                    styles.priorityIndicator,
                    { backgroundColor: priorityColor },
                ]}
            />
            <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.title}>
                        {message.title}
                    </ThemedText>
                    <View
                        style={[
                            styles.priorityBadge,
                            { backgroundColor: `${priorityColor}20` },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.priorityText,
                                { color: priorityColor },
                            ]}
                        >
                            {priorityLabels[message.priority]}
                        </ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.body}>{message.body}</ThemedText>

                {message.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {message.tags.map((tag, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.tag,
                                    {
                                        backgroundColor:
                                            colorScheme === "dark"
                                                ? Colors.dark.background
                                                : Colors.light.background,
                                    },
                                ]}
                            >
                                <ThemedText style={styles.tagText}>
                                    #{tag}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.timeContainer}>
                    <ThemedText style={styles.timeText}>
                        {formatDate(message.createdAt)} at{" "}
                        {formatTime(message.createdAt)}
                    </ThemedText>
                </View>
            </View>
        </View>
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
            ItemSeparatorComponent={() => (
                <View
                    style={[
                        styles.separator,
                        {
                            backgroundColor:
                                colorScheme === "dark" ? "#333" : "#e5e5e5",
                        },
                    ]}
                />
            )}
            ListEmptyComponent={ListEmptyComponent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
    },
    messageContainer: {
        flexDirection: "row",
        paddingVertical: 12,
    },
    priorityIndicator: {
        width: 4,
        borderRadius: 2,
        marginRight: 12,
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    title: {
        flex: 1,
        marginRight: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: "600",
    },
    body: {
        marginBottom: 8,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
        gap: 6,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        opacity: 0.7,
    },
    timeContainer: {
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.5,
    },
    separator: {
        height: 1,
        marginLeft: 16,
    },
});
