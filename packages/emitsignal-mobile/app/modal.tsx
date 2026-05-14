import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WCode, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { api } from '@/lib/api';

const SUGGESTED = [
    'deploy/staging',
    'k8s/cluster-a',
    'stripe/charges',
    'github/issues',
    'monitoring/uptime',
];

export default function SubscribeModal() {
    const { deviceId } = useDevice();
    const [topic, setTopic] = useState('alerts/prod');
    const [busy, setBusy] = useState(false);

    const handleSubscribe = async () => {
        if (!deviceId || !topic.trim()) {
            return;
        }
        setBusy(true);
        try {
            await api.subscribe(deviceId, topic.trim(), true);
            router.back();
        } catch (error) {
            console.error('Subscribe failed', error);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.root}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View style={styles.topBar}>
                        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                            <IconSymbol color={W.fg} name="xmark" size={14} />
                        </Pressable>
                        <Text style={styles.barTitle}>Subscribe</Text>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>TOPIC</Text>
                            <View style={styles.topicInputBox}>
                                <Text style={styles.prefix}>
                                    {api.baseUrl.replace(/^https?:\/\//, '')}/
                                </Text>
                                <TextInput
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onChangeText={setTopic}
                                    placeholder="alerts/prod"
                                    placeholderTextColor={W.fgDim}
                                    style={styles.topicInput}
                                    value={topic}
                                />
                            </View>
                            <Text style={styles.hint}>
                                a-z, 0-9, / and - · e.g.{' '}
                                <Text style={{ color: W.violet }}>team/backend/alerts</Text>
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>SUGGESTED</Text>
                            {SUGGESTED.map((suggestion) => (
                                <Pressable
                                    key={suggestion}
                                    onPress={() => setTopic(suggestion)}
                                    style={styles.suggestedRow}
                                >
                                    <WTopicAvatar name={suggestion} rounded={6} size={24} />
                                    <Text style={styles.suggestedText}>{suggestion}</Text>
                                    <IconSymbol color={W.fgDim} name="plus" size={13} />
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
                            disabled={busy || !topic.trim()}
                            onPress={handleSubscribe}
                            style={[styles.submit, (busy || !topic.trim()) && { opacity: 0.5 }]}
                        >
                            <Text style={styles.submitText}>
                                {busy ? 'subscribing…' : `subscribe → ${topic}`}
                            </Text>
                            <IconSymbol color={W.bg} name="arrow.right" size={14} />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    barTitle: { color: W.fg, fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
    closeBtn: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    footer: {
        backgroundColor: W.bg,
        borderTopColor: W.bgLine,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    hint: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        marginTop: 8,
    },
    prefix: { color: W.fgDim, fontFamily: Fonts.mono, fontSize: 13 },
    root: { backgroundColor: W.bg, flex: 1 },
    section: { paddingHorizontal: 20, paddingVertical: 12 },
    sectionLabel: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    submit: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 14,
    },
    submitText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    suggestedRow: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    suggestedText: {
        color: W.fg,
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 12.5,
    },
    topBar: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    topicInput: {
        color: W.fg,
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 14,
        padding: 0,
    },
    topicInputBox: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.violet,
        borderRadius: 10,
        borderWidth: 1.5,
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
