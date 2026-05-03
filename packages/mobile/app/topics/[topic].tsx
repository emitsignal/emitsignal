import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Message } from "@/lib/api";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WChip, WLogo, WTopicAvatar } from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { useTopicMessages } from "@/hooks/use-whinsper";

export default function TopicScreen() {
    const { topic } = useLocalSearchParams<{ topic: string }>();
    const { loading, messages } = useTopicMessages(topic);

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol color={W.fg} name="arrow.left" size={16} />
                </Pressable>
                <WTopicAvatar name={topic} rounded={6} size={32} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.channelName}>{topic}</Text>
                    <Text style={styles.channelMeta}>
                        {messages.length} message
                        {messages.length === 1 ? "" : "s"}
                    </Text>
                </View>
                <WLogo pulse size={11} />
            </View>

            <FlatList
                contentContainerStyle={messages.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
                data={messages}
                keyExtractor={(m) => m.id}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptyBody}>
                                Waiting for messages on <Text style={styles.mono}>{topic}</Text>…
                            </Text>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <MessageRow
                        message={item}
                        onPress={() => router.push(`/messages/${encodeURIComponent(item.id)}`)}
                    />
                )}
            />
        </SafeAreaView>
    );
}

function MessageRow({ message, onPress }: { message: Message; onPress: () => void }) {
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
            <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={styles.metaRow}>
                    <Text style={styles.timeText}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                    </Text>
                </View>
                <Text style={styles.title}>{message.title}</Text>
                <Text numberOfLines={3} style={styles.body}>
                    {message.body}
                </Text>
                {message.tags.length > 0 ? (
                    <View style={styles.tags}>
                        {message.tags.slice(0, 4).map((tag) => (
                            <WChip key={tag}>{tag}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        alignItems: "center",
        backgroundColor: W.bgElev,
        borderRadius: 8,
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    body: {
        color: W.fgMuted,
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 4,
    },
    channelMeta: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        marginTop: 2,
    },
    channelName: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
    },
    empty: { alignItems: "center", flex: 1, justifyContent: "center", padding: 40 },
    emptyBody: {
        color: W.fgMuted,
        fontSize: 13,
        marginTop: 8,
        textAlign: "center",
    },
    emptyTitle: { color: W.fg, fontSize: 16, fontWeight: "600" },
    metaRow: { flexDirection: "row", marginBottom: 4 },
    mono: { fontFamily: Fonts.mono },
    priorityRibbon: {
        bottom: 0,
        left: 0,
        position: "absolute",
        top: 0,
        width: 2,
    },
    root: { backgroundColor: W.bg, flex: 1 },
    row: {
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 14,
        position: "relative",
    },
    tags: { flexDirection: "row", gap: 6, marginTop: 8 },
    timeText: { color: W.fgDim, fontFamily: Fonts.mono, fontSize: 10.5 },
    title: { color: W.fg, fontSize: 14, fontWeight: "600" },
    topBar: {
        alignItems: "center",
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
});
