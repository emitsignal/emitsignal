import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WLogo } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";
import { api } from "@/lib/api";

export default function AuthSignIn() {
    const [email, setEmail] = useState("alex@hey.sh");
    const [busy, setBusy] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) return;
        setBusy(true);
        try {
            const result = await api.requestMagicLink(email.trim());
            router.push({
                pathname: "/auth/verify",
                params: {
                    email: email.trim(),
                    devCode: result.devCode ?? "",
                },
            });
        } catch (err) {
            Alert.alert(
                "Sign-in failed",
                err instanceof Error ? err.message : String(err),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.topBar}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <IconSymbol name="arrow.left" size={16} color={W.fg} />
                    </Pressable>
                    <WLogo size={11} pulse />
                    <Text style={styles.step}>01/04</Text>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>Sign in</Text>
                    <Text style={styles.lede}>
                        We'll email you a magic link. No passwords.
                    </Text>

                    <Text style={styles.fieldLabel}>EMAIL</Text>
                    <View style={styles.inputBox}>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor={W.fgDim}
                        />
                    </View>

                    <Pressable
                        onPress={handleSend}
                        disabled={busy}
                        style={[styles.cta, busy && { opacity: 0.6 }]}
                    >
                        <Text style={styles.ctaText}>
                            {busy ? "sending…" : "send magic link →"}
                        </Text>
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {[
                        { label: "continue with GitHub", icon: "globe" as const },
                        { label: "continue with SSH key", icon: "key" as const },
                    ].map((opt) => (
                        <Pressable
                            key={opt.label}
                            onPress={handleSend}
                            style={styles.altBtn}
                        >
                            <IconSymbol
                                name={opt.icon}
                                size={14}
                                color={W.violet}
                            />
                            <Text style={styles.altText}>{opt.label}</Text>
                            <IconSymbol
                                name="chevron.right"
                                size={13}
                                color={W.fgDim}
                            />
                        </Pressable>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.terms}>
                        by continuing you agree to the{"\n"}
                        <Text style={{ color: W.violet }}>terms</Text> ·{" "}
                        <Text style={{ color: W.violet }}>privacy</Text> ·{" "}
                        <Text style={{ color: W.violet }}>acceptable use</Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
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
    lede: { fontSize: 13, color: W.fgMuted, marginTop: 6, marginBottom: 28 },
    fieldLabel: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    inputBox: {
        backgroundColor: W.bgElev,
        borderColor: W.violet,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 18,
    },
    input: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        color: W.fg,
        padding: 0,
    },
    cta: {
        backgroundColor: W.violet,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    ctaText: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.bg,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 22,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: W.bgLine },
    dividerText: { fontFamily: Fonts.mono, fontSize: 10, color: W.fgDim },
    altBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },
    altText: {
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 13,
        color: W.fg,
    },
    footer: { padding: 28 },
    terms: {
        textAlign: "center",
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgDim,
        lineHeight: 18,
    },
});
