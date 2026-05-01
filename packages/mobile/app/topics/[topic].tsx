import { router, useLocalSearchParams } from "expo-router";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    WChip,
    WLogo,
    WTopicAvatar,
} from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { useTopicMessages } from "@/hooks/use-whinsper";
import type { Message } from "@/lib/api";

export default function TopicScreen() {
    const { topic } = useLocalSearchParams<{ topic: string }>();
    const { messages, loading } = useTopicMessages(topic);

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <IconSymbol name="arrow.left" size={16} color={W.fg} />
                </Pressable>
                <WTopicAvatar name={topic} size={32} rounded={6} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.channelName}>{topic}</Text>
                    <Text style={styles.channelMeta}>
                        {messages.length} message
                        {messages.length === 1 ? "" : "s"}
                    </Text>
                </View>
                <WLogo size={11} pulse />
            </View>

            <FlatList
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => (
                    <MessageRow
                        message={item}
                        onPress={() => router.push(`/messages/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>
                                No messages yet
                            </Text>
                            <Text style={styles.emptyBody}>
                                Waiting for messages on{" "}
                                <Text style={styles.mono}>{topic}</Text>…
                            </Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={
                    messages.length === 0 ? { flex: 1 } : { paddingBottom: 40 }
                }
            />
        </SafeAreaView>
    );
}

function MessageRow({
    message,
    onPress,
}: {
    message: Message;
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
            <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={styles.metaRow}>
                    <Text style={styles.timeText}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                    </Text>
                </View>
                <Text style={styles.title}>{message.title}</Text>
                <Text style={styles.body} numberOfLines={3}>
                    {message.body}
                </Text>
                {message.tags.length > 0 ? (
                    <View style={styles.tags}>
                        {message.tags.slice(0, 4).map((t) => (
                            <WChip key={t}>{t}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    backBtn: {
        width: 32,
        height: 32,
        backgroundColor: W.bgElev,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    channelName: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.fg,
    },
    channelMeta: {
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
        marginTop: 2,
    },
    row: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 14,
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
    metaRow: { flexDirection: "row", marginBottom: 4 },
    timeText: { fontFamily: Fonts.mono, fontSize: 10.5, color: W.fgDim },
    title: { fontSize: 14, fontWeight: "600", color: W.fg },
    body: {
        marginTop: 4,
        fontSize: 12.5,
        color: W.fgMuted,
        lineHeight: 18,
    },
    tags: { flexDirection: "row", gap: 6, marginTop: 8 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: W.fg },
    emptyBody: {
        marginTop: 8,
        fontSize: 13,
        color: W.fgMuted,
        textAlign: "center",
    },
    mono: { fontFamily: Fonts.mono },
});
