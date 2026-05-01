import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WLogo, WTopicAvatar } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";
import { useDevice } from "@/ctx/device";
import { api } from "@/lib/api";

const SUGGESTED = [
    { name: "deploy/prod", desc: "Production deploys" },
    { name: "alerts/prod", desc: "Server alerts & pages" },
    { name: "ci/web", desc: "Frontend CI builds" },
    { name: "errors/web", desc: "Errors & exceptions" },
];

export default function AuthFirstChannels() {
    const { deviceId } = useDevice();
    const [picked, setPicked] = useState<Record<string, boolean>>({
        "deploy/prod": true,
        "alerts/prod": true,
    });
    const [busy, setBusy] = useState(false);

    const toggle = (name: string) =>
        setPicked((p) => ({ ...p, [name]: !p[name] }));

    const pickedCount = Object.values(picked).filter(Boolean).length;

    const handleFinish = async () => {
        if (!deviceId) return;
        setBusy(true);
        try {
            for (const [name, on] of Object.entries(picked)) {
                if (on) await api.subscribe(deviceId, name, true);
            }
            router.replace("/(tabs)");
        } catch (err) {
            console.error("Subscribe failed", err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <IconSymbol name="arrow.left" size={16} color={W.fg} />
                </Pressable>
                <WLogo size={11} pulse />
                <Text style={styles.step}>04/04</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Your first channels</Text>
                <Text style={styles.lede}>
                    Pick a few to start. You can rename, filter, or create
                    new topics later.
                </Text>

                <ScrollView style={{ flex: 1 }}>
                    {SUGGESTED.map((s) => {
                        const on = !!picked[s.name];
                        return (
                            <Pressable
                                key={s.name}
                                onPress={() => toggle(s.name)}
                                style={[
                                    styles.row,
                                    on && styles.rowActive,
                                ]}
                            >
                                <WTopicAvatar
                                    name={s.name}
                                    size={34}
                                    rounded={8}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowName}>{s.name}</Text>
                                    <Text style={styles.rowDesc}>{s.desc}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.checkbox,
                                        on && styles.checkboxOn,
                                    ]}
                                >
                                    {on ? (
                                        <IconSymbol
                                            name="checkmark.circle.fill"
                                            size={14}
                                            color={W.bg}
                                        />
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <Pressable
                    onPress={handleFinish}
                    disabled={busy || pickedCount === 0}
                    style={[
                        styles.cta,
                        (busy || pickedCount === 0) && { opacity: 0.5 },
                    ]}
                >
                    <Text style={styles.ctaText}>
                        {busy
                            ? "subscribing…"
                            : `subscribe to ${pickedCount} · finish`}
                    </Text>
                    <IconSymbol name="arrow.right" size={14} color={W.bg} />
                </Pressable>
            </View>
        </SafeAreaView>
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
    backBtn: {
        width: 32,
        height: 32,
        backgroundColor: W.bgElev,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    step: {
        marginLeft: "auto",
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
    },
    body: { flex: 1, padding: 28 },
    title: { fontSize: 26, fontWeight: "600", color: W.fg, letterSpacing: -0.6 },
    lede: { fontSize: 13, color: W.fgMuted, marginTop: 6, marginBottom: 22 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 8,
    },
    rowActive: {
        backgroundColor: W.violetBg,
        borderColor: W.violet,
    },
    rowName: {
        fontFamily: Fonts.mono,
        fontSize: 13,
        fontWeight: "500",
        color: W.fg,
    },
    rowDesc: { fontSize: 11.5, color: W.fgMuted, marginTop: 2 },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: W.bgLine,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxOn: { backgroundColor: W.violet, borderColor: W.violet },
    footer: { padding: 28 },
    cta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: W.violet,
    },
    ctaText: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.bg,
    },
});
