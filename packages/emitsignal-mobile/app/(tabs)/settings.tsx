import type { PlanName } from '@emitsignal/shared/billing';

import { PLANS } from '@emitsignal/shared/billing';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PushToken } from '@/lib/api';
import type { FeedStyle } from '@/storage/feed-style';
import type { ThemePreference } from '@/storage/theme';

import { WLogo, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NativeSwitch } from '@/components/ui/native-switch';
import { Fonts, type Palette, palettes, UI } from '@/constants/theme';
import { useDebugSections } from '@/ctx/debug-sections';
import { useDevice } from '@/ctx/device';
import { useFeedStyle } from '@/ctx/feed-style';
import { useSession } from '@/ctx/session';
import { useTheme } from '@/ctx/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useThemedStyles } from '@/hooks/use-themed-styles';
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

const DEBUG_ITEMS = [
    { key: 'showPayload' as const, label: 'Show payload' },
    { key: 'showCurl' as const, label: 'Show curl command' },
    { key: 'showDelivery' as const, label: 'Show delivery' },
    { key: 'showSubscriptionMetrics' as const, label: 'Show subscription metrics' },
];

export default function SettingsScreen() {
    const { currentScheme, setTheme, theme } = useTheme();
    const { feedStyle, setFeedStyle } = useFeedStyle();
    const { sections, setSection } = useDebugSections();
    const { deleteAccount, signOut, user } = useSession();
    const palette = palettes[currentScheme];
    const styles = useMemo(() => createStyles(palette), [palette]);
    const bottomInset = useTabBarInset();

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

            <ScrollView contentContainerStyle={{ paddingBottom: bottomInset, paddingTop: 8 }}>
                <SectionLabel>APPEARANCE</SectionLabel>
                <View style={styles.group}>
                    <View style={styles.segmentedRow}>
                        <SegmentedControl
                            appearance={currentScheme}
                            onChange={(event) =>
                                setTheme(
                                    THEME_OPTIONS[event.nativeEvent.selectedSegmentIndex].value,
                                )
                            }
                            selectedIndex={THEME_OPTIONS.findIndex((opt) => opt.value === theme)}
                            tintColor={palette.violetBg}
                            values={THEME_OPTIONS.map((opt) => opt.label)}
                        />
                    </View>
                </View>

                <SectionLabel>FEED</SectionLabel>
                <View style={styles.group}>
                    {FEED_STYLE_OPTIONS.map((opt, index) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setFeedStyle(opt.value)}
                            style={[
                                styles.row,
                                index === FEED_STYLE_OPTIONS.length - 1 && styles.rowLast,
                                opt.value === feedStyle && styles.rowActive,
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowLabel}>{opt.label}</Text>
                                <Text style={styles.rowHint}>{opt.description}</Text>
                            </View>
                            {opt.value === feedStyle ? (
                                <IconSymbol
                                    color={palette.violet}
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
                        <>
                            <Pressable
                                onPress={() => {
                                    Alert.alert(
                                        'Delete account',
                                        'This permanently deletes your account and all associated data. This cannot be undone.',
                                        [
                                            { style: 'cancel', text: 'Cancel' },
                                            {
                                                onPress: async () => {
                                                    const { error } = await deleteAccount();

                                                    if (error) {
                                                        Alert.alert(
                                                            'Could not delete account',
                                                            error,
                                                        );
                                                        return;
                                                    }

                                                    router.replace('/auth');
                                                },
                                                style: 'destructive',
                                                text: 'Delete',
                                            },
                                        ],
                                    );
                                }}
                                style={styles.row}
                            >
                                <Text style={[styles.rowLabel, { color: palette.red }]}>
                                    Delete account
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
                                        { style: 'cancel', text: 'Cancel' },
                                        {
                                            onPress: async () => {
                                                await signOut();
                                                router.replace('/auth');
                                            },
                                            style: 'destructive',
                                            text: 'Sign out',
                                        },
                                    ]);
                                }}
                                style={[styles.row, styles.rowLast]}
                            >
                                <Text style={[styles.rowLabel, { color: palette.red }]}>
                                    Sign out
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <Pressable
                            onPress={() => router.push('/auth')}
                            style={[styles.row, styles.rowLast]}
                        >
                            <Text style={[styles.rowLabel, { color: palette.violet }]}>
                                Sign in
                            </Text>
                            <IconSymbol color={palette.fgDim} name="chevron.right" size={14} />
                        </Pressable>
                    )}
                </View>

                <SectionLabel>DEBUG</SectionLabel>
                <View style={styles.group}>
                    {DEBUG_ITEMS.map(({ key, label }, index) => (
                        <Pressable
                            key={key}
                            onPress={() => setSection(key, !sections[key])}
                            style={[
                                styles.row,
                                index === DEBUG_ITEMS.length - 1 && styles.rowLast,
                                sections[key] && styles.rowActive,
                            ]}
                        >
                            <Text style={styles.rowLabel}>{label}</Text>
                            {sections[key] ? (
                                <IconSymbol
                                    color={palette.violet}
                                    name="checkmark.circle.fill"
                                    size={18}
                                />
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                <SectionLabel>ABOUT</SectionLabel>
                <View style={styles.group}>
                    <View style={[styles.row, styles.rowLast]}>
                        <Text style={styles.rowLabel}>Version</Text>
                        <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '—'}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function NotificationsSection() {
    const { palette, styles } = useThemedStyles(createStyles);
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
                <View style={[styles.row, styles.rowLast]}>
                    <ActivityIndicator color={palette.violet} size="small" />
                </View>
            </View>
        );
    }

    if (!pushToken) {
        return (
            <View style={styles.group}>
                <Pressable onPress={handleEnable} style={[styles.row, styles.rowLast]}>
                    <Text style={styles.rowLabel}>Enable notifications</Text>
                    {enabling ? (
                        <ActivityIndicator color={palette.violet} size="small" />
                    ) : (
                        <IconSymbol color={palette.fgDim} name="chevron.right" size={14} />
                    )}
                </Pressable>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.group}>
                <View style={[styles.row, styles.rowLast]}>
                    <Text style={styles.rowLabel}>Push</Text>
                    <Text style={styles.rowValue}>on</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.group}>
            {loadingRecord ? (
                <View style={[styles.row, styles.rowLast]}>
                    <ActivityIndicator color={palette.violet} size="small" />
                </View>
            ) : (
                <View style={[styles.row, styles.rowLast]}>
                    <Text style={styles.rowLabel}>Push</Text>
                    <NativeSwitch
                        onValueChange={handleToggle}
                        value={tokenRecord?.pushEnabled ?? true}
                    />
                </View>
            )}
        </View>
    );
}

function PlanBadge({ plan }: { plan: PlanName }) {
    const { palette, styles } = useThemedStyles(createStyles);
    const badge: Record<PlanName, { bg: string; fg: string }> = {
        beam: { bg: palette.infoBg, fg: palette.cyan },
        free: { bg: palette.bgChip, fg: palette.fgDim },
        pulse: { bg: palette.violetBg, fg: palette.violet },
    };
    const colors = badge[plan];

    return (
        <View style={[styles.planBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.planBadgeText, { color: colors.fg }]}>
                {PLANS[plan].label.toUpperCase()}
            </Text>
        </View>
    );
}

function SectionLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        account: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 12,
            marginTop: 14,
        },
        accountName: {
            color: palette.fg,
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
            backgroundColor: palette.bgElev,
            borderRadius: UI.borderRadius.large,
            marginBottom: 8,
            marginHorizontal: 16,
            overflow: 'hidden',
        },
        header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
        headerTop: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
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
        root: { backgroundColor: palette.bg, flex: 1 },
        row: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 14,
        },
        rowActive: { backgroundColor: palette.violetBg, paddingVertical: 13 },
        rowHint: { color: palette.fgDim, fontFamily: Fonts.mono, fontSize: 10.5, marginTop: 2 },
        rowLabel: { color: palette.fg, flex: 1, fontSize: 14 },
        rowLast: { borderBottomWidth: 0 },
        rowValue: { color: palette.fgMuted, fontFamily: Fonts.mono, fontSize: 12 },
        sectionLabelRow: {
            paddingBottom: 6,
            paddingHorizontal: 36,
            paddingTop: 14,
        },
        sectionLabelText: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 1.5,
        },
        segmentedRow: { paddingHorizontal: 20, paddingVertical: 14 },
        subtitle: {
            color: palette.fgMuted,
            fontFamily: Fonts.mono,
            fontSize: 12,
            marginTop: 4,
        },
        title: {
            color: palette.fg,
            fontSize: 28,
            fontWeight: '600',
            letterSpacing: -0.5,
        },
    });
