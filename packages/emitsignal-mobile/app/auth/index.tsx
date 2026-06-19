import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WCode } from '@/components/base-theme';
import { Fonts, W } from '@/constants/theme';
import { useOnboarding } from '@/hooks/use-onboarding';
import { API_URL } from '@/lib/api';

export default function AuthWelcome() {
    const { markOnboardingComplete } = useOnboarding();
    const [pulse] = useState(() => new Animated.Value(1));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 0.6,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 1,
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
                    style={[styles.dot, { opacity: pulse, transform: [{ scale: pulse }] }]}
                />

                <Text style={styles.kicker}>EmitSignal · v{Constants.expoConfig?.version}</Text>
                <Text style={styles.title}>
                    Push notifications{'\n'}with <Text style={{ color: W.violet }}>one curl</Text>.
                </Text>
                <Text style={styles.lede}>
                    Subscribe to any topic. Publish from a shell, a cron, a CI, a webhook. Arrives
                    on your phone in under a second.
                </Text>

                <View style={{ marginTop: 16 }}>
                    <WCode language="NO ACCOUNT NEEDED · TRY IT">
                        {`$ curl -d "hi" ${API_URL.replace('https://', '').replace('http://', '')}/welcome`}
                    </WCode>
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable onPress={() => router.push('/auth/sign-in')} style={styles.cta}>
                    <Text style={styles.ctaText}>get started →</Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        await markOnboardingComplete();
                        router.replace('/(tabs)');
                    }}
                    style={{ marginTop: 14 }}
                >
                    <Text style={styles.skip}>skip · use as anonymous device</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1, justifyContent: 'center' },
    cta: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 12,
        paddingVertical: 14,
    },
    ctaText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    dot: {
        backgroundColor: W.violet,
        borderRadius: 22,
        height: 44,
        marginBottom: 36,
        shadowColor: W.violet,
        shadowOffset: { height: 0, width: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        width: 44,
    },
    footer: { paddingBottom: 12 },
    glow: {
        backgroundColor: `${W.violet}33`,
        borderRadius: 220,
        height: 440,
        left: '20%',
        opacity: 0.4,
        position: 'absolute',
        top: -120,
        width: 440,
    },
    kicker: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 14,
    },
    lede: {
        color: W.fgMuted,
        fontSize: 14,
        lineHeight: 22,
        maxWidth: 320,
    },
    root: { backgroundColor: W.bg, flex: 1, padding: 28 },
    skip: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 12,
        textAlign: 'center',
    },
    title: {
        color: W.fg,
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -1.1,
        lineHeight: 40,
        marginBottom: 16,
    },
});
