import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PushToken } from '@/lib/api';
import type { FeedStyle } from '@/storage/feed-style';
import type { ThemePreference } from '@/storage/theme';

import { WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useDebugSections } from '@/ctx/debug-sections';
import { useDevice } from '@/ctx/device';
import { useFeedStyle } from '@/ctx/feed-style';
import { useSession } from '@/ctx/session';
import { useTheme } from '@/ctx/theme';
import { api } from '@/lib/api';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
];

const FEED_STYLE_OPTIONS: { description: string; label: string; value: FeedStyle }[] = [
    { description: 'Card rows with avatar, body preview and tags', label: 'Comfy', value: 'comfy' },
    {
        description: 'Chronological thread with priority dots on a vertical line',
        label: 'Timeline',
        value: 'timeline',
    },
    {
        description: 'Messages grouped by priority, highest first',
        label: 'Priority-first',
        value: 'priority',
    },
];

export default function SettingsScreen() {
    const { sections, setSection } = useDebugSections();
    const { setTheme, theme } = useTheme();
    const { feedStyle, setFeedStyle } = useFeedStyle();
    const { signOut, user } = useSession();

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                </View>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>{user?.email ?? 'anonymous device'}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <SectionLabel>APPEARANCE</SectionLabel>
                <View style={styles.group}>
                    {THEME_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setTheme(opt.value)}
                            style={[styles.row, opt.value === theme && styles.rowActive]}
                        >
                            <Text style={styles.rowLabel}>{opt.label}</Text>
                            {opt.value === theme ? (
                                <IconSymbol
                                    color={W.violet}
                                    name="checkmark.circle.fill"
                                    size={18}
                                />
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                <SectionLabel>FEED</SectionLabel>

                <View style={styles.group}>
                    {FEED_STYLE_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setFeedStyle(opt.value)}
                            style={[styles.row, opt.value === feedStyle && styles.rowActive]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowLabel}>{opt.label}</Text>
                                <Text style={styles.rowHint}>{opt.description}</Text>
                            </View>
                            {opt.value === feedStyle ? (
                                <IconSymbol
                                    color={W.violet}
                                    name="checkmark.circle.fill"
                                    size={18}
                                />
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                <SectionLabel>NOTIFICATIONS</SectionLabel>
                <NotificationsSection />

                <SectionLabel>ACCOUNT</SectionLabel>
                <View style={styles.group}>
                    {user ? (
                        <Pressable
                            onPress={async () => {
                                await signOut();
                                router.replace('/auth');
                            }}
                            style={styles.row}
                        >
                            <Text style={[styles.rowLabel, { color: W.red }]}>Sign out</Text>
                        </Pressable>
                    ) : (
                        <Pressable onPress={() => router.push('/auth')} style={styles.row}>
                            <Text style={[styles.rowLabel, { color: W.violet }]}>Sign in</Text>
                            <IconSymbol color={W.violet} name="arrow.right" size={14} />
                        </Pressable>
                    )}
                </View>

                <SectionLabel>DEBUG</SectionLabel>
                <View style={styles.group}>
                    {[
                        { key: 'showPayload' as const, label: 'Show payload' },
                        { key: 'showCurl' as const, label: 'Show curl command' },
                        { key: 'showDelivery' as const, label: 'Show delivery' },
                    ].map(({ key, label }) => (
                        <Pressable
                            key={key}
                            onPress={() => setSection(key, !sections[key])}
                            style={[styles.row, sections[key] && styles.rowActive]}
                        >
                            <Text style={styles.rowLabel}>{label}</Text>
                            {sections[key] ? (
                                <IconSymbol
                                    color={W.violet}
                                    name="checkmark.circle.fill"
                                    size={18}
                                />
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                <SectionLabel>ABOUT</SectionLabel>

                <View style={styles.group}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Version</Text>
                        <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '—'}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function NotificationsSection() {
    const { deviceId, isLoading, pushToken, refreshPushToken } = useDevice();
    const { user } = useSession();
    const [tokenRecord, setTokenRecord] = useState<null | PushToken>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [enabling, setEnabling] = useState(false);

    useEffect(() => {
        if (!pushToken || !user) {
            return;
        }

        setLoadingRecord(true);

        api.listMyPushTokens()
            .then((tokens) =>
                setTokenRecord(tokens.find((token) => token.deviceId === deviceId) ?? null),
            )
            .catch(() => setTokenRecord(null))
            .finally(() => setLoadingRecord(false));
    }, [pushToken, user, deviceId]);

    const handleEnable = async () => {
        if (!deviceId) {
            return;
        }
        setEnabling(true);

        try {
            const token = await refreshPushToken();

            if (token) {
                const platform = (
                    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
                ) as 'android' | 'ios' | 'web';

                await api.registerPushToken({
                    deviceId,
                    platform,
                    token,
                    userId: user?.id ?? null,
                });
            }
        } finally {
            setEnabling(false);
        }
    };

    const handleToggle = async (pushEnabled: boolean) => {
        if (!tokenRecord) {
            return;
        }

        const previous = tokenRecord;

        setTokenRecord((prev) => (prev ? { ...prev, pushEnabled } : null));

        try {
            await api.updatePushToken(tokenRecord.id, pushEnabled);
        } catch {
            setTokenRecord(previous);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.group}>
                <View style={styles.row}>
                    <ActivityIndicator color={W.violet} size="small" />
                </View>
            </View>
        );
    }

    if (!pushToken) {
        return (
            <View style={styles.group}>
                <Pressable onPress={handleEnable} style={styles.row}>
                    <Text style={styles.rowLabel}>Enable notifications</Text>
                    {enabling ? (
                        <ActivityIndicator color={W.violet} size="small" />
                    ) : (
                        <IconSymbol color={W.violet} name="arrow.right" size={14} />
                    )}
                </Pressable>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.group}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Push</Text>
                    <Text style={styles.rowValue}>on</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.group}>
            {loadingRecord ? (
                <View style={styles.row}>
                    <ActivityIndicator color={W.violet} size="small" />
                </View>
            ) : (
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Push</Text>
                    <Switch
                        onValueChange={handleToggle}
                        thumbColor={W.fg}
                        trackColor={{ false: W.bgLine, true: W.violet }}
                        value={tokenRecord?.pushEnabled ?? true}
                    />
                </View>
            )}
        </View>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        backgroundColor: W.bgElev,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
    headerTop: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
    root: { backgroundColor: W.bg, flex: 1 },
    row: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    rowActive: { backgroundColor: W.violetBg, paddingVertical: 13 },
    rowHint: { color: W.fgDim, fontFamily: Fonts.mono, fontSize: 10.5, marginTop: 2 },
    rowLabel: { color: W.fg, flex: 1, fontSize: 14 },
    rowValue: { color: W.fgMuted, fontFamily: Fonts.mono, fontSize: 12 },
    sectionLabelLine: {
        backgroundColor: W.bgLine,
        flex: 1,
        height: 1,
        marginLeft: 10,
    },
    sectionLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    sectionLabelText: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 1.5,
    },
    subtitle: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 12,
        marginTop: 4,
    },
    title: {
        color: W.fg,
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
});
