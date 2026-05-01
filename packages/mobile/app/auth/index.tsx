import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WCode } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";

export default function AuthWelcome() {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 0.6,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [pulse]);

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.glow} />
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.dot,
                        { transform: [{ scale: pulse }], opacity: pulse },
                    ]}
                />
                <Text style={styles.kicker}>WHINSPER · v0.1</Text>
                <Text style={styles.title}>
                    Push notifications{"\n"}with{" "}
                    <Text style={{ color: W.violet }}>one curl</Text>.
                </Text>
                <Text style={styles.lede}>
                    Subscribe to any topic. Publish from a shell, a cron, a
                    CI, a webhook. Arrives on your phone in under a second.
                </Text>
                <View style={{ marginTop: 16 }}>
                    <WCode language="NO ACCOUNT NEEDED · TRY IT">
                        {`$ curl -d "hi" whinsper.local/alex-tryout`}
                    </WCode>
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable
                    onPress={() => router.push("/auth/sign-in")}
                    style={styles.cta}
                >
                    <Text style={styles.ctaText}>get started →</Text>
                </Pressable>
                <Pressable
                    onPress={() => router.replace("/(tabs)")}
                    style={{ marginTop: 14 }}
                >
                    <Text style={styles.skip}>
                        skip · use as anonymous device
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg, padding: 28 },
    glow: {
        position: "absolute",
        top: -120,
        left: "20%",
        width: 440,
        height: 440,
        borderRadius: 220,
        backgroundColor: `${W.violet}33`,
        opacity: 0.4,
    },
    content: { flex: 1, justifyContent: "center" },
    dot: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: W.violet,
        marginBottom: 36,
        shadowColor: W.violet,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    kicker: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: W.fgDim,
        letterSpacing: 2,
        marginBottom: 14,
    },
    title: {
        fontSize: 36,
        fontWeight: "700",
        color: W.fg,
        letterSpacing: -1.1,
        lineHeight: 40,
        marginBottom: 16,
    },
    lede: {
        fontSize: 14,
        color: W.fgMuted,
        lineHeight: 22,
        maxWidth: 320,
    },
    footer: { paddingBottom: 12 },
    cta: {
        paddingVertical: 14,
        backgroundColor: W.violet,
        borderRadius: 12,
        alignItems: "center",
    },
    ctaText: {
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: "600",
        color: W.bg,
    },
    skip: {
        textAlign: "center",
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fgDim,
    },
});
