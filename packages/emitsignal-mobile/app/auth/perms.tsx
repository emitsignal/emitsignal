import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NativeSwitch } from '@/components/ui/native-switch';
import { Fonts, type Palette } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api, type PushToken } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

const PLATFORM_LABEL: Record<string, string> = {
    android: 'Android · FCM',
    ios: 'iOS · APNs',
    web: 'Web · push',
};

export default function AuthPerms() {
    const { palette, styles } = useThemedStyles(createStyles);
    const [chosen, setChosen] = useState(false);
    const [granted, setGranted] = useState(false);
    const { deviceId, refreshPushToken } = useDevice();
    const { loading: sessionLoading, user } = useSession();
    const queryClient = useQueryClient();

    const userId = user?.id;

    const { data: tokens = [], isFetching: loadingTokens } = useQuery({
        enabled: granted && Boolean(userId) && !sessionLoading,
        queryFn: () => api.listMyPushTokens(),
        queryKey: queryKeys.pushTokens,
    });

    const handleAllow = async () => {
        setChosen(true);
        let pushToken: null | string = null;

        try {
            const { status } = await Notifications.requestPermissionsAsync();

            setGranted(status === 'granted');

            if (status === 'granted') {
                pushToken = await refreshPushToken();
            }
        } catch {
            setGranted(true); // simulator fallback

            pushToken = await refreshPushToken();
        }

        if (pushToken && deviceId) {
            const platform = (
                Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
            ) as 'android' | 'ios' | 'web';

            api.registerPushToken({
                deviceId,
                platform,
                token: pushToken,
                userId: userId ?? null,
            })
                .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.pushTokens }))
                .catch((error) => console.warn('push-token register failed', error));
        }
    };

    const handleToggle = async (id: string, pushEnabled: boolean) => {
        if (!user) {
            return;
        }

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

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol color={palette.fg} name="arrow.left" size={16} />
                </Pressable>
                <WLogo pulse size={11} />
                <Text style={styles.step}>03/05</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Allow notifications</Text>
                <Text style={styles.lede}>
                    This device becomes a delivery target. You can mute, filter, or set quiet hours
                    per-channel later.
                </Text>

                <View style={styles.permCard}>
                    <View style={styles.permHeader}>
                        <View style={styles.permIcon}>
                            <IconSymbol color={palette.bg} name="bell" size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.permTitle}>
                                {'"EmitSignal" would like to send you notifications'}
                            </Text>
                            <Text style={styles.permSub}>Alerts, sounds, icon badges</Text>
                        </View>
                    </View>
                    <View style={styles.permActions}>
                        <Pressable
                            onPress={() => {
                                setGranted(false);
                                setChosen(true);
                            }}
                            style={[
                                styles.permActionDeny,
                                chosen && !granted && styles.permActionDenyActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.permActionDenyText,
                                    chosen && !granted && styles.permActionDenyActiveText,
                                ]}
                            >
                                {"Don't Allow"}
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleAllow}
                            style={[
                                styles.permActionAllow,
                                granted && { backgroundColor: palette.green },
                            ]}
                        >
                            <Text style={styles.permActionAllowText}>
                                {granted ? '✓ Allowed' : 'Allow'}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {granted && (
                    <>
                        <Text style={styles.fieldLabel}>DELIVERY TARGETS</Text>
                        <View style={styles.targetGroup}>
                            {loadingTokens ? (
                                <View style={styles.targetRow}>
                                    <ActivityIndicator color={palette.violet} size="small" />
                                    <Text style={styles.targetSub}>Loading devices…</Text>
                                </View>
                            ) : tokens.length === 0 ? (
                                <View style={styles.targetRow}>
                                    <Text style={styles.targetSub}>
                                        No devices registered yet. Push tokens will appear here
                                        after the next app launch.
                                    </Text>
                                </View>
                            ) : (
                                tokens.map((t) => (
                                    <TargetRow
                                        key={t.id}
                                        label={
                                            t.deviceId === deviceId
                                                ? 'This device'
                                                : `Device · ${
                                                      PLATFORM_LABEL[t.platform] ?? t.platform
                                                  }`
                                        }
                                        on={t.pushEnabled}
                                        onChange={(v) => handleToggle(t.id, v)}
                                        sub={PLATFORM_LABEL[t.platform] ?? t.platform}
                                    />
                                ))
                            )}
                        </View>
                    </>
                )}
            </View>

            <View style={styles.footer}>
                <Pressable onPress={() => router.replace('/auth/avatar')} style={styles.cta}>
                    <Text style={styles.ctaText}>continue →</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

function TargetRow({
    label,
    on,
    onChange,
    sub,
}: {
    label: string;
    on: boolean;
    onChange: (v: boolean) => void;
    sub: string;
}) {
    const { styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.targetRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.targetLabel}>{label}</Text>
                <Text style={styles.targetSub}>{sub}</Text>
            </View>
            <NativeSwitch onValueChange={onChange} value={on} />
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        backBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderRadius: 8,
            height: 32,
            justifyContent: 'center',
            width: 32,
        },
        body: { flex: 1, padding: 28 },
        cta: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            paddingVertical: 14,
        },
        ctaText: {
            color: palette.bg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        fieldLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 10,
        },
        footer: { padding: 28 },
        lede: { color: palette.fgMuted, fontSize: 13, marginBottom: 24, marginTop: 6 },
        permActionAllow: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 8,
            flex: 1,
            paddingVertical: 10,
        },
        permActionAllowText: {
            color: palette.bg,
            fontSize: 12,
            fontWeight: '600',
        },
        permActionDeny: {
            alignItems: 'center',
            backgroundColor: palette.bg,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            flex: 1,
            paddingVertical: 10,
        },
        permActionDenyActive: {
            backgroundColor: palette.dangerBg,
            borderColor: palette.red,
        },
        permActionDenyActiveText: { color: palette.red },
        permActionDenyText: { color: palette.fgMuted, fontSize: 12 },
        permActions: { flexDirection: 'row', gap: 8 },
        permCard: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 14,
            borderWidth: StyleSheet.hairlineWidth,
            marginBottom: 22,
            padding: 20,
        },
        permHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 14 },
        permIcon: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            height: 40,
            justifyContent: 'center',
            width: 40,
        },
        permSub: { color: palette.fgMuted, fontSize: 11.5, marginTop: 2 },
        permTitle: { color: palette.fg, fontSize: 14, fontWeight: '600' },
        root: { backgroundColor: palette.bg, flex: 1 },
        step: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            marginLeft: 'auto',
        },
        targetGroup: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
        },
        targetLabel: { color: palette.fg, fontSize: 13 },
        targetRow: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        targetSub: { color: palette.fgDim, fontFamily: Fonts.mono, fontSize: 10.5, marginTop: 2 },
        title: { color: palette.fg, fontSize: 26, fontWeight: '600', letterSpacing: -0.6 },
        topBar: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
    });
