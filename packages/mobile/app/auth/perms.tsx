import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WLogo } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";

export default function AuthPerms() {
    const [granted, setGranted] = useState(false);
    const [pushMobile, setPushMobile] = useState(true);
    const [pushWeb, setPushWeb] = useState(true);

    const handleAllow = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            setGranted(status === "granted");
        } catch {
            setGranted(true); // simulator fallback
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
                <Text style={styles.step}>03/04</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Allow notifications</Text>
                <Text style={styles.lede}>
                    This device becomes a delivery target. You can mute,
                    filter, or set quiet hours per-channel later.
                </Text>

                <View style={styles.permCard}>
                    <View style={styles.permHeader}>
                        <View style={styles.permIcon}>
                            <IconSymbol
                                name="bell"
                                size={20}
                                color={W.bg}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.permTitle}>
                                "Whinsper" would like to send you notifications
                            </Text>
                            <Text style={styles.permSub}>
                                Alerts, sounds, icon badges
                            </Text>
                        </View>
                    </View>
                    <View style={styles.permActions}>
                        <Pressable style={styles.permActionDeny}>
                            <Text style={styles.permActionDenyText}>
                                Don't Allow
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleAllow}
                            style={[
                                styles.permActionAllow,
                                granted && { backgroundColor: W.green },
                            ]}
                        >
                            <Text style={styles.permActionAllowText}>
                                {granted ? "✓ Allowed" : "Allow"}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.fieldLabel}>DELIVERY TARGETS</Text>
                <View style={styles.targetGroup}>
                    <TargetRow
                        label="This device · Pixel 8"
                        sub="device-id · FCM"
                        on={pushMobile}
                        onChange={setPushMobile}
                    />
                    <TargetRow
                        label="Web · this browser"
                        sub="chrome · web push"
                        on={pushWeb}
                        onChange={setPushWeb}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable
                    onPress={() => router.replace("/auth/first-channels")}
                    style={styles.cta}
                >
                    <Text style={styles.ctaText}>continue →</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

function TargetRow({
    label,
    sub,
    on,
    onChange,
}: {
    label: string;
    sub: string;
    on: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <View style={styles.targetRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.targetLabel}>{label}</Text>
                <Text style={styles.targetSub}>{sub}</Text>
            </View>
            <Switch
                value={on}
                onValueChange={onChange}
                trackColor={{ false: W.bgLine, true: W.violet }}
                thumbColor={W.fg}
            />
        </View>
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
    lede: { fontSize: 13, color: W.fgMuted, marginTop: 6, marginBottom: 24 },
    permCard: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 14,
        padding: 20,
        marginBottom: 22,
    },
    permHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    permIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: W.violet,
        alignItems: "center",
        justifyContent: "center",
    },
    permTitle: { fontSize: 14, fontWeight: "600", color: W.fg },
    permSub: { fontSize: 11.5, color: W.fgMuted, marginTop: 2 },
    permActions: { flexDirection: "row", gap: 8 },
    permActionDeny: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: W.bg,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        alignItems: "center",
    },
    permActionDenyText: { fontSize: 12, color: W.fgMuted },
    permActionAllow: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: W.violet,
        borderRadius: 8,
        alignItems: "center",
    },
    permActionAllowText: {
        fontSize: 12,
        fontWeight: "600",
        color: W.bg,
    },
    fieldLabel: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    targetGroup: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
    },
    targetRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    targetLabel: { fontSize: 13, color: W.fg },
    targetSub: { fontFamily: Fonts.mono, fontSize: 10.5, color: W.fgDim, marginTop: 2 },
    footer: { padding: 28 },
    cta: {
        paddingVertical: 14,
        backgroundColor: W.violet,
        borderRadius: 10,
        alignItems: "center",
    },
    ctaText: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.bg,
    },
});
