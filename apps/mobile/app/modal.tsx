import { router, Stack } from "expo-router";
import { useState } from "react";
import {
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
import { WCode, WTopicAvatar } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";
import { useDevice } from "@/ctx/device";
import { api } from "@/lib/api";

const SUGGESTED = [
    "deploy/staging",
    "k8s/cluster-a",
    "stripe/charges",
    "github/issues",
    "monitoring/uptime",
];

export default function SubscribeModal() {
    const { deviceId } = useDevice();
    const [topic, setTopic] = useState("alerts/prod");
    const [busy, setBusy] = useState(false);

    const handleSubscribe = async () => {
        if (!deviceId || !topic.trim()) return;
        setBusy(true);
        try {
            await api.subscribe(deviceId, topic.trim(), true);
            router.back();
        } catch (err) {
            console.error("Subscribe failed", err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.root}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.topBar}>
                        <Pressable
                            onPress={() => router.back()}
                            style={styles.closeBtn}
                        >
                            <IconSymbol name="xmark" size={14} color={W.fg} />
                        </Pressable>
                        <Text style={styles.barTitle}>Subscribe</Text>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>TOPIC</Text>
                            <View style={styles.topicInputBox}>
                                <Text style={styles.prefix}>
                                    {api.baseUrl.replace(/^https?:\/\//, "")}/
                                </Text>
                                <TextInput
                                    value={topic}
                                    onChangeText={setTopic}
                                    style={styles.topicInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    placeholder="alerts/prod"
                                    placeholderTextColor={W.fgDim}
                                />
                            </View>
                            <Text style={styles.hint}>
                                a-z, 0-9, / and - · e.g.{" "}
                                <Text style={{ color: W.violet }}>
                                    team/backend/alerts
                                </Text>
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>SUGGESTED</Text>
                            {SUGGESTED.map((s) => (
                                <Pressable
                                    key={s}
                                    onPress={() => setTopic(s)}
                                    style={styles.suggestedRow}
                                >
                                    <WTopicAvatar name={s} size={24} rounded={6} />
                                    <Text style={styles.suggestedText}>{s}</Text>
                                    <IconSymbol
                                        name="plus"
                                        size={13}
                                        color={W.fgDim}
                                    />
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PUBLISH FROM</Text>
                            <WCode language="BASH">
                                {`# from your shell
curl -d "hello" ${api.baseUrl}/topic/${topic}

# from a script
wsp publish ${topic} "deploy ok"`}
                            </WCode>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={handleSubscribe}
                            disabled={busy || !topic.trim()}
                            style={[
                                styles.submit,
                                (busy || !topic.trim()) && { opacity: 0.5 },
                            ]}
                        >
                            <Text style={styles.submitText}>
                                {busy ? "subscribing…" : `subscribe → ${topic}`}
                            </Text>
                            <IconSymbol
                                name="arrow.right"
                                size={14}
                                color={W.bg}
                            />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    closeBtn: {
        width: 32,
        height: 32,
        backgroundColor: W.bgElev,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    barTitle: { fontSize: 16, fontWeight: "600", color: W.fg, letterSpacing: -0.3 },
    section: { paddingHorizontal: 20, paddingVertical: 12 },
    sectionLabel: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgDim,
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    topicInputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: W.bgElev,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: W.violet,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    prefix: { fontFamily: Fonts.mono, fontSize: 13, color: W.fgDim },
    topicInput: {
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 14,
        color: W.fg,
        padding: 0,
    },
    hint: {
        marginTop: 8,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
    },
    suggestedRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 4,
    },
    suggestedText: {
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 12.5,
        color: W.fg,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: W.bgLine,
        backgroundColor: W.bg,
    },
    submit: {
        backgroundColor: W.violet,
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    submitText: {
        fontFamily: Fonts.mono,
        fontWeight: "600",
        fontSize: 14,
        color: W.bg,
    },
});
