import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type PushToken } from '@/lib/api';

const PLATFORM_LABEL: Record<string, string> = {
    android: 'Android · FCM',
    ios: 'iOS · APNs',
    web: 'Web · push',
};

export default function AuthPerms() {
    const { deviceId, refreshPushToken } = useDevice();
    const { token, user } = useSession();
    const [granted, setGranted] = useState(false);
    const [chosen, setChosen] = useState(false);
    const [tokens, setTokens] = useState<PushToken[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(false);

    useEffect(() => {
        if (!granted || !token) {
            return;
        }

        setLoadingTokens(true);

        api.listMyPushTokens()
            .then(setTokens)
            .catch(() => setTokens([]))
            .finally(() => setLoadingTokens(false));
    }, [granted, token]);

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
                userId: user?.id ?? null,
            }).catch((error) => console.warn('push-token register failed', error));
        }
    };

    const handleToggle = async (id: string, pushEnabled: boolean) => {
        if (!token) {
            return;
        }

        setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, pushEnabled } : t)));

        try {
            await api.updatePushToken(id, pushEnabled);
        } catch {
            setTokens((prev) =>
                prev.map((t) => (t.id === id ? { ...t, pushEnabled: !pushEnabled } : t)),
            );
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol color={W.fg} name="arrow.left" size={16} />
                </Pressable>
                <WLogo pulse size={11} />
                <Text style={styles.step}>03/04</Text>
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
                            <IconSymbol color={W.bg} name="bell" size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.permTitle}>
                                "EmitSignal" would like to send you notifications
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
                                Don't Allow
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleAllow}
                            style={[
                                styles.permActionAllow,
                                granted && { backgroundColor: W.green },
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
                                    <ActivityIndicator color={W.violet} size="small" />
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
                <Pressable
                    onPress={() => router.replace('/auth/first-channels')}
                    style={styles.cta}
                >
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
    return (
        <View style={styles.targetRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.targetLabel}>{label}</Text>
                <Text style={styles.targetSub}>{sub}</Text>
            </View>
            <Switch
                onValueChange={onChange}
                thumbColor={W.fg}
                trackColor={{ false: W.bgLine, true: W.violet }}
                value={on}
            />
        </View>
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
    cta: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        paddingVertical: 14,
    },
    ctaText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    fieldLabel: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    footer: { padding: 28 },
    lede: { color: W.fgMuted, fontSize: 13, marginBottom: 24, marginTop: 6 },
    permActionAllow: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 8,
        flex: 1,
        paddingVertical: 10,
    },
    permActionAllowText: {
        color: W.bg,
        fontSize: 12,
        fontWeight: '600',
    },
    permActionDeny: {
        alignItems: 'center',
        backgroundColor: W.bg,
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        flex: 1,
        paddingVertical: 10,
    },
    permActionDenyActive: {
        backgroundColor: 'rgba(248,113,113,0.10)',
        borderColor: W.red,
    },
    permActionDenyActiveText: { color: W.red },
    permActionDenyText: { color: W.fgMuted, fontSize: 12 },
    permActions: { flexDirection: 'row', gap: 8 },
    permCard: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 22,
        padding: 20,
    },
    permHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 14 },
    permIcon: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    permSub: { color: W.fgMuted, fontSize: 11.5, marginTop: 2 },
    permTitle: { color: W.fg, fontSize: 14, fontWeight: '600' },
    root: { backgroundColor: W.bg, flex: 1 },
    step: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        marginLeft: 'auto',
    },
    targetGroup: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    targetLabel: { color: W.fg, fontSize: 13 },
    targetRow: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    targetSub: { color: W.fgDim, fontFamily: Fonts.mono, fontSize: 10.5, marginTop: 2 },
    title: { color: W.fg, fontSize: 26, fontWeight: '600', letterSpacing: -0.6 },
    topBar: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
});
