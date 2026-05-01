import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    ActivitySparkline,
    WCode,
    WLogo,
    WTopicAvatar,
} from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";
import { api, type Topic } from "@/lib/api";

export default function PublishScreen() {
    const [topic, setTopic] = useState("alerts/prod");
    const [title, setTitle] = useState("Deploy succeeded");
    const [body, setBody] = useState("api-gateway shipped to prod");
    const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [tags, setTags] = useState("deploy,prod");
    const [topics, setTopics] = useState<Topic[]>([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.listTopics().then(setTopics).catch(() => {});
    }, []);

    const handlePublish = async () => {
        if (!topic.trim() || !title.trim()) return;
        setBusy(true);
        try {
            await api.publish(topic.trim(), {
                title: title.trim(),
                body: body.trim(),
                priority,
                tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            });
            Alert.alert("Published", `→ ${topic}`);
            const updated = await api.listTopics();
            setTopics(updated);
        } catch (err) {
            Alert.alert("Failed", err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const curl = `curl -d "${body}" \\
  -H "Content-Type: application/json" \\
  ${api.baseUrl}/topic/${topic}`;

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <WLogo size={12} pulse />
                        </View>
                        <Text style={styles.title}>Publish</Text>
                        <Text style={styles.subtitle}>
                            {topics.length} owned topic
                            {topics.length === 1 ? "" : "s"}
                        </Text>
                    </View>

                    <SectionLabel>QUICKSTART</SectionLabel>
                    <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                        <WCode language="CURL · ANYWHERE">{curl}</WCode>
                    </View>

                    <SectionLabel>COMPOSE</SectionLabel>
                    <View style={styles.form}>
                        <FieldLabel>TOPIC</FieldLabel>
                        <TextInput
                            value={topic}
                            onChangeText={setTopic}
                            style={styles.input}
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder="deploy/prod"
                            placeholderTextColor={W.fgDim}
                        />

                        <FieldLabel>TITLE</FieldLabel>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            style={styles.input}
                            placeholder="Deploy succeeded"
                            placeholderTextColor={W.fgDim}
                        />

                        <FieldLabel>BODY</FieldLabel>
                        <TextInput
                            value={body}
                            onChangeText={setBody}
                            style={[styles.input, styles.textArea]}
                            multiline
                            placeholder="api-gateway → vercel prod"
                            placeholderTextColor={W.fgDim}
                        />

                        <FieldLabel>PRIORITY</FieldLabel>
                        <View style={styles.prioRow}>
                            {[1, 2, 3, 4, 5].map((p) => (
                                <Pressable
                                    key={p}
                                    onPress={() => setPriority(p as 1 | 2 | 3 | 4 | 5)}
                                    style={[
                                        styles.prioBtn,
                                        p === priority && styles.prioBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.prioText,
                                            p === priority &&
                                                styles.prioTextActive,
                                        ]}
                                    >
                                        {p}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <FieldLabel>TAGS</FieldLabel>
                        <TextInput
                            value={tags}
                            onChangeText={setTags}
                            style={styles.input}
                            placeholder="comma,separated,tags"
                            placeholderTextColor={W.fgDim}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Pressable
                            onPress={handlePublish}
                            disabled={busy}
                            style={[styles.publishBtn, busy && { opacity: 0.6 }]}
                        >
                            <Text style={styles.publishText}>
                                {busy ? "publishing…" : `publish → ${topic}`}
                            </Text>
                            <IconSymbol
                                name="arrow.right"
                                size={14}
                                color={W.bg}
                            />
                        </Pressable>
                    </View>

                    <SectionLabel>OWNED TOPICS</SectionLabel>
                    {topics.map((t) => {
                        const seed = t.id.charCodeAt(t.id.length - 1);
                        const chart = Array.from({ length: 12 }, (_, i) =>
                            Math.abs(Math.sin((seed + i) * 0.5)) * 5,
                        );
                        return (
                            <View key={t.id} style={styles.topicRow}>
                                <WTopicAvatar
                                    name={t.name}
                                    size={32}
                                    rounded={6}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.topicName}>
                                        {t.name}
                                    </Text>
                                    <Text style={styles.topicMeta}>
                                        {t.isPublic ? "public" : "private"}
                                    </Text>
                                </View>
                                <View style={{ width: 70 }}>
                                    <ActivitySparkline
                                        data={chart}
                                        color={W.violet}
                                        height={20}
                                        showTotal={false}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </KeyboardAvoidingView>
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

function FieldLabel({ children }: { children: string }) {
    return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
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
    form: { paddingHorizontal: 20 },
    fieldLabel: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.2,
        marginTop: 14,
        marginBottom: 6,
    },
    input: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 13,
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    prioRow: { flexDirection: "row", gap: 6 },
    prioBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: W.bgChip,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
    },
    prioBtnActive: {
        backgroundColor: W.violetBg,
        borderColor: W.violet,
    },
    prioText: { color: W.fgDim, fontFamily: Fonts.mono, fontWeight: "600" },
    prioTextActive: { color: W.violet },
    publishBtn: {
        marginTop: 24,
        backgroundColor: W.violet,
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    publishText: {
        fontFamily: Fonts.mono,
        fontWeight: "600",
        color: W.bg,
        fontSize: 14,
    },
    topicRow: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    topicName: { fontFamily: Fonts.mono, fontSize: 12.5, color: W.fg },
    topicMeta: {
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
        marginTop: 2,
    },
});
