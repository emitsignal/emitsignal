import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WLogo, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useTopicSuggestions } from '@/hooks/use-topic-suggestions';

export default function AuthFirstChannels() {
    const { deviceId } = useDevice();
    const { markOnboardingComplete } = useOnboarding();
    const { subscribe } = useSubscriptions();
    const { data: suggestions } = useTopicSuggestions(deviceId);
    const [picked, setPicked] = useState<Record<string, boolean>>({});
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!suggestions) {
            return;
        }

        const initial: Record<string, boolean> = {};

        for (const suggestion of suggestions) {
            if (suggestion.name.startsWith('emitsignal/')) {
                initial[suggestion.name] = true;
            }
        }

        setPicked(initial);
    }, [suggestions]);

    const toggle = (name: string) => setPicked((p) => ({ ...p, [name]: !p[name] }));

    const pickedCount = Object.values(picked).filter(Boolean).length;

    const handleFinish = async () => {
        if (!deviceId) {
            return;
        }
        setBusy(true);
        try {
            for (const [name, on] of Object.entries(picked)) {
                if (on) await subscribe(name);
            }
            await markOnboardingComplete();
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Subscribe failed', error);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol color={W.fg} name="arrow.left" size={16} />
                </Pressable>
                <WLogo pulse size={11} />
                <Text style={styles.step}>05/05</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Your first channels</Text>
                <Text style={styles.lede}>
                    Pick a few to start. You can rename, filter, or create new topics later.
                </Text>

                <ScrollView style={{ flex: 1 }}>
                    {suggestions?.map((suggestion) => {
                        const on = !!picked[suggestion.name];
                        return (
                            <Pressable
                                key={suggestion.name}
                                onPress={() => toggle(suggestion.name)}
                                style={[styles.row, on && styles.rowActive]}
                            >
                                <WTopicAvatar name={suggestion.name} rounded={8} size={34} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowName}>{suggestion.name}</Text>
                                    <Text style={styles.rowDesc}>
                                        {suggestion.description ?? ''}
                                    </Text>
                                </View>

                                <View style={[styles.checkbox, on && styles.checkboxOn]}>
                                    {on ? (
                                        <IconSymbol
                                            color={W.bg}
                                            name="checkmark.circle.fill"
                                            size={14}
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
                    disabled={busy || pickedCount === 0}
                    onPress={handleFinish}
                    style={[styles.cta, (busy || pickedCount === 0) && { opacity: 0.5 }]}
                >
                    <Text style={styles.ctaText}>
                        {busy ? 'subscribing…' : `subscribe to ${pickedCount} · finish`}
                    </Text>
                    <IconSymbol color={W.bg} name="arrow.right" size={14} />
                </Pressable>

                <Pressable
                    onPress={async () => {
                        await markOnboardingComplete();
                        router.replace('/(tabs)');
                    }}
                    style={{ marginTop: 14 }}
                >
                    <Text style={styles.skip}>skip for now</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    body: { flex: 1, padding: 28 },
    checkbox: {
        alignItems: 'center',
        borderColor: W.bgLine,
        borderRadius: 5,
        borderWidth: 1.5,
        height: 22,
        justifyContent: 'center',
        width: 22,
    },
    checkboxOn: { backgroundColor: W.violet, borderColor: W.violet },
    cta: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 14,
    },
    ctaText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    footer: { padding: 28 },
    lede: { color: W.fgMuted, fontSize: 13, marginBottom: 22, marginTop: 6 },
    root: { backgroundColor: W.bg, flex: 1 },
    row: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: 1.5,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    rowActive: {
        backgroundColor: W.violetBg,
        borderColor: W.violet,
    },
    rowDesc: { color: W.fgMuted, fontSize: 11.5, marginTop: 2 },
    rowName: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 13,
        fontWeight: '500',
    },
    skip: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 12,
        textAlign: 'center',
    },
    step: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        marginLeft: 'auto',
    },
    title: { color: W.fg, fontSize: 26, fontWeight: '600', letterSpacing: -0.6 },
    topBar: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
});
