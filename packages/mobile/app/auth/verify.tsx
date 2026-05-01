import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { useSession } from "@/ctx/session";
import { api } from "@/lib/api";

export default function AuthVerify() {
    const params = useLocalSearchParams<{ email?: string; devCode?: string }>();
    const { signIn } = useSession();
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Dev convenience — auto-fill the code if the backend returned one
        if (params.devCode && code === "") {
            const seq = params.devCode;
            let i = 0;
            const id = setInterval(() => {
                i++;
                setCode(seq.slice(0, i));
                if (i >= seq.length) clearInterval(id);
            }, 380);
            return () => clearInterval(id);
        }
    }, [params.devCode]);

    const handleVerify = async () => {
        if (!params.email || code.length !== 6) return;
        setBusy(true);
        try {
            const res = await api.verifyMagicLink(params.email, code);
            await signIn(res.token, res.user);
            router.replace("/auth/perms");
        } catch (err) {
            Alert.alert(
                "Invalid code",
                err instanceof Error ? err.message : String(err),
            );
        } finally {
            setBusy(false);
        }
    };

    const cells = Array.from({ length: 6 }, (_, i) => code[i] ?? "");
    const activeIdx = code.length;

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
                    <Text style={styles.step}>02/04</Text>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.lede}>
                        We sent a 6-char code to{" "}
                        <Text style={styles.mono}>{params.email}</Text>. Tap
                        the link or paste the code here.
                    </Text>

                    <Text style={styles.fieldLabel}>CODE</Text>
                    <Pressable
                        onPress={() => inputRef.current?.focus()}
                        style={styles.codeRow}
                    >
                        {cells.map((c, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.codeCell,
                                    i === activeIdx && styles.codeCellActive,
                                ]}
                            >
                                <Text style={styles.codeChar}>{c}</Text>
                            </View>
                        ))}
                        <TextInput
                            ref={inputRef}
                            value={code}
                            onChangeText={(t) =>
                                setCode(
                                    t.replace(/[^a-z0-9]/gi, "")
                                        .toLowerCase()
                                        .slice(0, 6),
                                )
                            }
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={6}
                            style={styles.hiddenInput}
                        />
                    </Pressable>

                    <Text style={styles.expires}>
                        expires in <Text style={{ color: W.amber }}>09:42</Text>
                    </Text>

                    <Pressable
                        onPress={handleVerify}
                        disabled={busy || code.length !== 6}
                        style={[
                            styles.cta,
                            (busy || code.length !== 6) && styles.ctaDisabled,
                        ]}
                    >
                        <Text
                            style={[
                                styles.ctaText,
                                code.length !== 6 && { color: W.fgDim },
                            ]}
                        >
                            {busy ? "verifying…" : "verify →"}
                        </Text>
                    </Pressable>

                    <Text style={styles.resend}>
                        didn't arrive?{" "}
                        <Text style={{ color: W.violet }}>resend</Text>
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
    mono: { fontFamily: Fonts.mono, color: W.fg },
    fieldLabel: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    codeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    codeCell: {
        width: 48,
        height: 56,
        borderRadius: 10,
        backgroundColor: W.bgElev,
        borderWidth: 1.5,
        borderColor: W.bgLine,
        alignItems: "center",
        justifyContent: "center",
    },
    codeCellActive: { borderColor: W.violet },
    codeChar: {
        fontFamily: Fonts.mono,
        fontSize: 20,
        fontWeight: "600",
        color: W.fg,
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        width: 1,
        height: 1,
    },
    expires: { fontFamily: Fonts.mono, fontSize: 11, color: W.fgDim, marginBottom: 24 },
    cta: {
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: W.violet,
        alignItems: "center",
    },
    ctaDisabled: {
        backgroundColor: W.bgElev,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
    },
    ctaText: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.bg,
    },
    resend: {
        textAlign: "center",
        marginTop: 18,
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fgDim,
    },
});
