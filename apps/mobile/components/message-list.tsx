import React from "react";
import { SectionList, StyleSheet, View, type ViewStyle } from "react-native";
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

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatDateHeader(timestamp: number): string {
    const date = new Date(timestamp);
    return date
        .toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        .toUpperCase();
}

function MessageItem({ message }: { message: Message }) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
    const priorityColor = PriorityColors[message.priority];

    // Priority 3 ("default") typically doesn't show a strong color in ntfy,
    // but the user asked for a left border.
    // Let's use the defined priority color.
    // If priority is 1 (min) or 2 (low), maybe subtle?
    // User mockup shows orange for warning.

    return (
        <ThemedView
            style={[
                styles.messageItem,
                {
                    backgroundColor: colors.cardBackground,
                    borderBottomColor: colors.border,
                    borderLeftColor: priorityColor,
                },
            ]}
        >
            <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.title}>
                        {message.title}
                    </ThemedText>
                    <ThemedText style={styles.timeText}>
                        {formatTime(message.createdAt)}
                    </ThemedText>
                </View>

                <ThemedText style={styles.body} numberOfLines={10}>
                    {message.body}
                </ThemedText>

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
                    </View>
                )}
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
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    // Group messages by date
    const sections = React.useMemo(() => {
        const groups: { [key: string]: Message[] } = {};
        messages.forEach((msg) => {
            const dateKey = formatDateHeader(msg.createdAt);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });

        return Object.keys(groups).map((date) => ({
            title: date,
            data: groups[date],
        }));
    }, [messages]);

    if (messages.length === 0 && ListEmptyComponent) {
        return <View style={style}>{ListEmptyComponent}</View>;
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <MessageItem message={item} />}
            renderSectionHeader={({ section: { title } }) => (
                <View
                    style={[
                        styles.sectionHeader,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <ThemedText style={styles.sectionHeaderText}>
                        {title}
                    </ThemedText>
                </View>
            )}
            contentContainerStyle={[styles.listContainer, style]}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingHorizontal: UI.spacing.lg,
        paddingVertical: UI.spacing.md,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: "600",
        opacity: 0.5,
        letterSpacing: 0.5,
    },
    messageItem: {
        paddingVertical: UI.spacing.md,
        paddingHorizontal: UI.spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth, // Thin separator
        borderLeftWidth: 4, // Prominent priority indicator
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: UI.spacing.xs,
    },
    title: {
        fontSize: 16,
        flex: 1,
        marginRight: UI.spacing.sm,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.5,
        fontVariant: ["tabular-nums"],
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
        marginBottom: UI.spacing.sm,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: UI.spacing.xs,
    },
    tag: {
        paddingHorizontal: UI.spacing.sm,
        paddingVertical: 2,
        borderRadius: UI.borderRadius.small,
    },
    tagText: {
        fontSize: 11,
        opacity: 0.7,
    },
});
