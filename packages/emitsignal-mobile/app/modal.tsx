import { publishUrl, TOPIC_NAME_MAX_LENGTH } from '@emitsignal/shared/topic';
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
import { SubscriptionSettingsFields } from '@/components/subscription-settings-fields';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useTopicSuggestions } from '@/hooks/use-topic-suggestions';
import { api, type ListenSince, PUBLISH_BASE_URL } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';

export default function SubscribeModal() {
    const [busy, setBusy] = useState(false);
    const [listenSince, setListenSince] = useState<ListenSince>('subscription_date');
    const [pushEnabled, setPushEnabled] = useState(true);
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('');
    const [error, setError] = useState<null | string>(null);
    const { palette, styles } = useThemedStyles(createStyles);

    const { deviceId } = useDevice();
    const { subscribe } = useSubscriptions();
    const { data: suggestions } = useTopicSuggestions(deviceId);

    const handleSubscribe = async () => {
        if (!deviceId || !topic.trim()) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await subscribe(topic.trim(), {
                pushEnabled,
                settings: { description: description.trim(), listenSince },
            });

            router.back();
        } catch (subscribeError) {
            setError(apiErrorMessage(subscribeError, 'Could not subscribe to this topic'));
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
                            <IconSymbol color={palette.fg} name="xmark" size={14} />
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
                                    autoFocus
                                    maxLength={TOPIC_NAME_MAX_LENGTH}
                                    onChangeText={(value) => {
                                        setTopic(value);
                                        setError(null);
                                    }}
                                    placeholder="alerts/prod"
                                    placeholderTextColor={palette.fgDim}
                                    style={styles.topicInput}
                                    value={topic}
                                />
                            </View>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <IconSymbol
                                        color={palette.red}
                                        name="exclamationmark.triangle"
                                        size={13}
                                    />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : (
                                <Text style={styles.hint}>
                                    a-z, 0-9, / and - · e.g.{' '}
                                    <Text style={{ color: palette.violet }}>acme/infra</Text>
                                </Text>
                            )}
                        </View>

                        {suggestions && suggestions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>SUGGESTED</Text>
                                {suggestions.map((suggestion) => (
                                    <Pressable
                                        key={suggestion.name}
                                        onPress={() => setTopic(suggestion.name)}
                                        style={styles.suggestedRow}
                                    >
                                        <WTopicAvatar
                                            name={suggestion.name}
                                            rounded={6}
                                            size={24}
                                        />

                                        <Text style={styles.suggestedText}>{suggestion.name}</Text>
                                        <IconSymbol color={palette.fgDim} name="plus" size={13} />
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        <View style={styles.section}>
                            <SubscriptionSettingsFields
                                description={description}
                                listenSince={listenSince}
                                onChangeDescription={setDescription}
                                onChangeListenSince={setListenSince}
                                onChangePushEnabled={setPushEnabled}
                                pushEnabled={pushEnabled}
                            />
                        </View>

                        {topic && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>PUBLISH FROM</Text>
                                <WCode language="BASH">
                                    {`# from your shell
curl -d "hello" ${publishUrl(PUBLISH_BASE_URL, topic)}

# from EmitSignal cli
emitsignal publish ${topic} "deploy ok"`}
                                </WCode>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            disabled={busy || !topic.trim()}
                            onPress={handleSubscribe}
                            style={[styles.submit, (busy || !topic.trim()) && { opacity: 0.5 }]}
                        >
                            <Text style={styles.submitText}>
                                {busy ? 'Subscribing…' : `Subscribe`}
                            </Text>

                            <IconSymbol color={palette.bg} name="arrow.right" size={14} />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        barTitle: { color: palette.fg, fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
        closeBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderRadius: 8,
            height: 32,
            justifyContent: 'center',
            width: 32,
        },
        errorBox: {
            alignItems: 'center',
            backgroundColor: palette.dangerBg,
            borderRadius: 8,
            flexDirection: 'row',
            gap: 8,
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        errorText: {
            color: palette.red,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 11.5,
            lineHeight: 16,
        },
        footer: {
            backgroundColor: palette.bg,
            borderTopColor: palette.bgLine,
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingHorizontal: 20,
            paddingVertical: 14,
        },
        hint: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
            marginTop: 8,
        },
        prefix: { color: palette.fgDim, fontFamily: Fonts.mono, fontSize: 12 },
        root: { backgroundColor: palette.bg, flex: 1 },
        section: { paddingHorizontal: 20, paddingVertical: 12 },
        sectionLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 11,
            letterSpacing: 1.2,
            marginBottom: 8,
        },
        submit: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
            paddingVertical: 14,
        },
        submitText: {
            color: palette.bg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        suggestedRow: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 10,
            marginBottom: 4,
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        suggestedText: {
            color: palette.fg,
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
            color: palette.fg,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 14,
            padding: 0,
        },
        topicInputBox: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.violet,
            borderRadius: 10,
            borderWidth: 1.5,
            flexDirection: 'row',
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
    });
