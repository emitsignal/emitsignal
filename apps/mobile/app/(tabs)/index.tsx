import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    WChip,
    WLogo,
    WTopicAvatar,
    WDot,
} from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { useFeed } from "@/hooks/use-whinsper";
import type { Message, Subscription } from "@/lib/api";

const FILTERS = ["all", "p4+", "unread", "deploy", "alerts", "ci"] as const;
type Filter = (typeof FILTERS)[number];

export default function FeedScreen() {
    const { messages, subscriptions, loading, error, refresh } = useFeed();
    const [filter, setFilter] = useState<Filter>("all");

    const subscriptionMap = useMemo(() => {
        const m = new Map<string, Subscription>();
        for (const s of subscriptions) m.set(s.topic.id, s);
        return m;
    }, [subscriptions]);

    const filtered = useMemo(() => {
        if (filter === "all") return messages;
        if (filter === "p4+") return messages.filter((m) => m.priority >= 4);
        return messages.filter((m) => {
            const sub = subscriptionMap.get(m.topicId);
            return sub?.topic.name.includes(filter);
        });
    }, [filter, messages, subscriptionMap]);

    const now = filtered.slice(0, 2);
    const earlier = filtered.slice(2);

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo size={12} pulse />
                    <Text style={styles.live}>● live</Text>
                </View>
                <Text style={styles.title}>Inbox</Text>
                <Text style={styles.subtitle}>
                    {messages.length} message{messages.length === 1 ? "" : "s"} ·{" "}
                    {subscriptions.length} channel
                    {subscriptions.length === 1 ? "" : "s"}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRow}
            >
                {FILTERS.map((f) => (
                    <Pressable
                        key={f}
                        onPress={() => setFilter(f)}
                        style={[
                            styles.filterPill,
                            f === filter && styles.filterPillActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                f === filter && styles.filterTextActive,
                            ]}
                        >
                            {f}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <FlatList
                data={[
                    ...(now.length ? [{ kind: "label" as const, text: "NOW" }] : []),
                    ...now.map((m) => ({ kind: "row" as const, message: m })),
                    ...(earlier.length
                        ? [{ kind: "label" as const, text: "EARLIER" }]
                        : []),
                    ...earlier.map((m) => ({ kind: "row" as const, message: m })),
                ]}
                keyExtractor={(item, i) =>
                    item.kind === "label" ? `${item.text}-${i}` : item.message.id
                }
                renderItem={({ item }) =>
                    item.kind === "label" ? (
                        <SectionLabel>{item.text}</SectionLabel>
                    ) : (
                        <NotifRow
                            message={item.message}
                            topicName={
                                subscriptionMap.get(item.message.topicId)?.topic
                                    .name ?? "unknown"
                            }
                            onPress={() => router.push(`/messages/${item.message.id}`)}
                        />
                    )
                }
                ListEmptyComponent={
                    !loading ? (
                        <EmptyFeed message={error?.message} />
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refresh}
                        tintColor={W.violet}
                        colors={[W.violet]}
                    />
                }
                contentContainerStyle={
                    filtered.length === 0 ? { flex: 1 } : { paddingBottom: 40 }
                }
            />
        </SafeAreaView>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

function NotifRow({
    message,
    topicName,
    onPress,
}: {
    message: Message;
    topicName: string;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <View
                style={[
                    styles.priorityRibbon,
                    {
                        backgroundColor: PriorityColors[message.priority],
                        opacity: message.priority >= 4 ? 1 : 0.4,
                    },
                ]}
            />
            <WTopicAvatar name={topicName} size={34} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.rowMeta}>
                    <Text style={styles.rowChannel}>{topicName}</Text>
                    <Text style={styles.rowTime}>{relativeTime(message.createdAt)}</Text>
                </View>
                <Text style={styles.rowTitle}>{message.title}</Text>
                <Text style={styles.rowBody} numberOfLines={2}>
                    {message.body}
                </Text>
                {message.tags.length > 0 ? (
                    <View style={styles.tagRow}>
                        {message.tags.slice(0, 3).map((t) => (
                            <WChip key={t}>{t}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

function EmptyFeed({ message }: { message?: string }) {
    return (
        <View style={styles.empty}>
            <WDot level={2} size={10} />
            <Text style={styles.emptyTitle}>
                {message ? "Could not load feed" : "No messages yet"}
            </Text>
            <Text style={styles.emptyBody}>
                {message ?? "Subscribe to a channel to start receiving notifications."}
            </Text>
        </View>
    );
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    return `${day}d`;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: W.bg,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    live: {
        marginLeft: "auto",
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: W.fg,
        letterSpacing: -0.5,
    },
    subtitle: {
        marginTop: 4,
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fgMuted,
    },
    filterScroll: {
        flexGrow: 0,
        flexShrink: 0,
    },
    filterRow: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 6,
        alignItems: "center",
    },
    filterPill: {
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 100,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
        alignSelf: "flex-start",
    },
    filterPillActive: {
        backgroundColor: W.violetBg,
        borderColor: `${W.violetDim}55`,
    },
    filterText: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgMuted,
    },
    filterTextActive: {
        color: W.violet,
    },
    sectionLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 6,
    },
    sectionLabelText: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        fontWeight: "500",
    },
    sectionLabelLine: {
        flex: 1,
        height: 1,
        marginLeft: 10,
        backgroundColor: W.bgLine,
    },
    row: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: "row",
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
        position: "relative",
    },
    priorityRibbon: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
    },
    rowMeta: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 2,
    },
    rowChannel: {
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
        flex: 1,
    },
    rowTime: {
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: W.fg,
        marginBottom: 4,
    },
    rowBody: {
        fontSize: 12.5,
        color: W.fgMuted,
        lineHeight: 18,
        marginBottom: 6,
    },
    tagRow: {
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: W.fg,
        marginTop: 6,
    },
    emptyBody: {
        fontSize: 13,
        color: W.fgMuted,
        textAlign: "center",
    },
});
