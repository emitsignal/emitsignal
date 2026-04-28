import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WChip, WCode, WDot, WLogo } from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { api, type Message, type Topic } from "@/lib/api";

export default function MessageDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [message, setMessage] = useState<Message | null>(null);
    const [topic, setTopic] = useState<Topic | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const allTopics = await api.listTopics();
            for (const t of allTopics) {
                const msgs = await api.listMessages(t.name, 200);
                const found = msgs.find((m) => m.id === id);
                if (found && !cancelled) {
                    setMessage(found);
                    setTopic(t);
                    return;
                }
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (!message || !topic) {
        return (
            <SafeAreaView style={styles.root}>
                <Text style={styles.loading}>loading…</Text>
            </SafeAreaView>
        );
    }

    const prio = message.priority;
    const prioLabel =
        prio >= 5 ? "max" : prio === 4 ? "high" : prio === 3 ? "default" : "low";

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <IconSymbol name="arrow.left" size={16} color={W.fg} />
                </Pressable>
                <WLogo size={11} pulse />
                <Text style={styles.channelLabel}>{topic.name}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.hero}>
                    <View style={styles.prioRow}>
                        <WDot level={prio} size={8} />
                        <Text
                            style={[
                                styles.prioText,
                                { color: PriorityColors[prio] },
                            ]}
                        >
                            priority {prio} · {prioLabel}
                        </Text>
                    </View>
                    <Text style={styles.title}>{message.title}</Text>
                    <Text style={styles.body}>{message.body}</Text>

                    <View style={styles.tagsRow}>
                        {message.tags.map((t) => (
                            <WChip key={t}>{`#${t}`}</WChip>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.actionBtn, styles.actionPrimary]}
                        >
                            <IconSymbol
                                name="checkmark.circle.fill"
                                size={14}
                                color={W.bg}
                            />
                            <Text style={styles.actionPrimaryText}>
                                Acknowledge
                            </Text>
                        </Pressable>
                        <Pressable style={styles.actionBtn}>
                            <IconSymbol
                                name="globe"
                                size={14}
                                color={W.fg}
                            />
                            <Text style={styles.actionText}>View</Text>
                        </Pressable>
                    </View>
                </View>

                <SectionHead>payload</SectionHead>
                <View style={styles.codeWrap}>
                    <WCode language="JSON">
                        {JSON.stringify(
                            {
                                topic: topic.name,
                                title: message.title,
                                body: message.body,
                                priority: message.priority,
                                tags: message.tags,
                                createdAt: new Date(
                                    message.createdAt,
                                ).toISOString(),
                            },
                            null,
                            2,
                        )}
                    </WCode>
                </View>

                <SectionHead>reproduce · curl</SectionHead>
                <View style={styles.codeWrap}>
                    <WCode language="BASH">
                        {`curl -X POST ${api.baseUrl}/topic/${topic.name} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
                            title: message.title,
                            body: message.body,
                            priority: message.priority,
                            tags: message.tags,
                        })}'`}
                    </WCode>
                </View>

                <SectionHead>delivery</SectionHead>
                {[
                    { t: formatTime(message.createdAt), e: "received", ok: true },
                    { t: formatTime(message.createdAt), e: `routed → ${topic.name}`, ok: true },
                    { t: formatTime(message.createdAt + 1000), e: "push → fcm", ok: true },
                    { t: formatTime(message.createdAt + 2000), e: "delivered · this device", ok: true },
                ].map((s, i) => (
                    <View key={i} style={styles.timelineRow}>
                        <Text style={styles.timelineTime}>{s.t}</Text>
                        <Text
                            style={[
                                styles.timelineDot,
                                { color: s.ok ? W.green : W.red },
                            ]}
                        >
                            {s.ok ? "✓" : "✗"}
                        </Text>
                        <Text style={styles.timelineText}>{s.e}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

function SectionHead({ children }: { children: string }) {
    return <Text style={styles.sectionHead}>{children}</Text>;
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n: number) {
    return n.toString().padStart(2, "0");
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg },
    loading: {
        flex: 1,
        textAlign: "center",
        paddingTop: 40,
        color: W.fgMuted,
        fontFamily: Fonts.mono,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
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
    channelLabel: {
        marginLeft: "auto",
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
    },
    hero: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    prioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    prioText: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1.2,
    },
    title: {
        marginTop: 12,
        fontSize: 22,
        fontWeight: "600",
        letterSpacing: -0.6,
        color: W.fg,
        lineHeight: 28,
    },
    body: {
        marginTop: 10,
        fontSize: 14,
        color: W.fgMuted,
        lineHeight: 22,
    },
    tagsRow: {
        marginTop: 14,
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
    },
    actions: { marginTop: 14, flexDirection: "row", gap: 8 },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: W.bgElev,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
    },
    actionPrimary: { backgroundColor: W.violet, borderColor: W.violet },
    actionText: {
        fontSize: 12.5,
        color: W.fg,
        fontWeight: "600",
    },
    actionPrimaryText: { fontSize: 12.5, color: W.bg, fontWeight: "600" },
    sectionHead: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        marginTop: 18,
        marginBottom: 8,
        paddingHorizontal: 20,
        fontWeight: "500",
    },
    codeWrap: { paddingHorizontal: 20 },
    timelineRow: {
        paddingHorizontal: 20,
        paddingVertical: 6,
        flexDirection: "row",
        gap: 10,
    },
    timelineTime: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgDim,
        width: 64,
    },
    timelineDot: { fontFamily: Fonts.mono, fontSize: 11, width: 12 },
    timelineText: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgMuted,
        flex: 1,
    },
});
