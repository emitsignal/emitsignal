import type { PlanName } from '@emitsignal/shared/billing';

import { PLANS } from '@emitsignal/shared/billing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { WLogo, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useDebugSections } from '@/ctx/debug-sections';
import { useDevice } from '@/ctx/device';
import { useFeedStyle } from '@/ctx/feed-style';
import { useSession } from '@/ctx/session';
import { useTheme } from '@/ctx/theme';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

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

    const { data: billing } = useQuery({
        enabled: Boolean(user),
        queryFn: () => api.getBilling(),
        queryKey: queryKeys.billing,
    });

    const plan = billing?.plan;

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                </View>

                <Text style={styles.title}>Settings</Text>

                {user ? (
                    <View style={styles.account}>
                        {user.image ? (
                            <Image source={{ uri: user.image }} style={styles.avatar} />
                        ) : (
                            <WTopicAvatar name={user.name || user.email} rounded={20} size={40} />
                        )}
                        <View style={styles.accountText}>
                            <View style={styles.accountNameRow}>
                                <Text numberOfLines={1} style={styles.accountName}>
                                    {user.name || user.email.split('@')[0]}
                                </Text>
                                {plan ? <PlanBadge plan={plan} /> : null}
                            </View>
                            <Text numberOfLines={1} style={styles.subtitle}>
                                {user.email}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.subtitle}>anonymous device</Text>
                )}
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
    const [enabling, setEnabling] = useState(false);
    const queryClient = useQueryClient();

    const { data: tokens = [], isFetching: loadingRecord } = useQuery({
        enabled: Boolean(pushToken && user),
        queryFn: () => api.listMyPushTokens(),
        queryKey: queryKeys.pushTokens,
    });

    const tokenRecord = tokens.find((token) => token.deviceId === deviceId) ?? null;

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

                void queryClient.invalidateQueries({ queryKey: queryKeys.pushTokens });
            }
        } finally {
            setEnabling(false);
        }
    };

    const handleToggle = async (pushEnabled: boolean) => {
        if (!tokenRecord) {
            return;
        }

        const { id } = tokenRecord;

        const apply = (next: boolean) =>
            queryClient.setQueryData<PushToken[]>(queryKeys.pushTokens, (previous) =>
                (previous ?? []).map((token) =>
                    token.id === id ? { ...token, pushEnabled: next } : token,
                ),
            );

        apply(pushEnabled);

        try {
            await api.updatePushToken(id, pushEnabled);
        } catch {
            apply(!pushEnabled);
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

const PLAN_BADGE_COLORS: Record<PlanName, { bg: string; fg: string }> = {
    beam: { bg: 'rgba(103,232,249,0.12)', fg: W.cyan },
    free: { bg: W.bgChip, fg: W.fgDim },
    pulse: { bg: W.violetBg, fg: W.violet },
};

function PlanBadge({ plan }: { plan: PlanName }) {
    const palette = PLAN_BADGE_COLORS[plan];

    return (
        <View style={[styles.planBadge, { backgroundColor: palette.bg }]}>
            <Text style={[styles.planBadgeText, { color: palette.fg }]}>
                {PLANS[plan].label.toUpperCase()}
            </Text>
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
    account: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
    },
    accountName: {
        color: W.fg,
        flexShrink: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    accountNameRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    accountText: { flex: 1 },
    avatar: {
        borderRadius: 20,
        height: 40,
        width: 40,
    },
    group: {
        backgroundColor: W.bgElev,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
    headerTop: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
    planBadge: {
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    planBadgeText: {
        fontFamily: Fonts.mono,
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
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
