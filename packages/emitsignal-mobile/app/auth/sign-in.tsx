import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { authClient } from '@/lib/auth-client';
import { claimDeviceSubscriptions } from '@/lib/claim-device-subscriptions';

const WEBSITE_URL = 'https://emitsignal.com';
const TERMS_URL = `${WEBSITE_URL}/terms`;
const PRIVACY_URL = `${WEBSITE_URL}/privacy`;
const CODE_OF_CONDUCT_URL = `${WEBSITE_URL}/code-of-conduct`;

const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
};

// Social sign-in buttons, in display order. Apple is only offered on Apple devices.
const SOCIAL_PROVIDERS = [
    { icon: 'globe', label: 'GitHub', provider: 'github' },
    ...(Platform.OS === 'ios'
        ? ([{ icon: 'apple.logo', label: 'Apple', provider: 'apple' }] as const)
        : []),
] as const;

type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]['provider'];

export default function AuthSignIn() {
    const [busy, setBusy] = useState(false);
    const [email, setEmail] = useState('');
    const [pendingProvider, setPendingProvider] = useState<null | SocialProvider>(null);
    const { palette, styles } = useThemedStyles(createStyles);
    const { deviceId } = useDevice();

    const handleSend = async () => {
        if (!email.trim()) {
            return;
        }

        setBusy(true);

        const { error } = await authClient.emailOtp.sendVerificationOtp({
            email: email.trim(),
            type: 'sign-in',
        });
        setBusy(false);

        if (error) {
            Alert.alert('Sign-in failed', error.message ?? 'Failed to send sign-in code');
        } else {
            router.push({ params: { email: email.trim() }, pathname: '/auth/verify' });
        }
    };

    const handleSocial = async (provider: SocialProvider, label: string) => {
        setPendingProvider(provider);

        const { error } = await authClient.signIn.social({ callbackURL: '/', provider });

        if (error) {
            setPendingProvider(null);

            return Alert.alert(
                'Sign-in failed',
                error.message ?? `Failed to sign in with ${label}`,
            );
        }
        // The browser flow resolves without an error even when the user cancels,
        // so only redirect once we confirm a session was actually established.

        const { data: session } = await authClient.getSession({
            query: { disableCookieCache: true },
        });

        setPendingProvider(null);

        if (session?.user) {
            // Adopt any subscriptions made on this device while anonymous into the account.
            await claimDeviceSubscriptions(deviceId, {
                token: session.session.token,
                userId: session.user.id,
            });

            router.replace('/');
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.topBar}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <IconSymbol color={palette.fg} name="arrow.left" size={16} />
                    </Pressable>
                    <WLogo pulse size={11} />
                    <Text style={styles.step}>01/05</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.body}>
                        <Text style={styles.title}>Sign in</Text>
                        <Text style={styles.lede}>
                            {"We'll email you a sign-in code. No passwords."}
                        </Text>

                        <Text style={styles.fieldLabel}>EMAIL</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor={palette.fgDim}
                                style={styles.input}
                                value={email}
                            />
                        </View>

                        <Pressable
                            disabled={busy}
                            onPress={handleSend}
                            style={[styles.cta, busy && { opacity: 0.6 }]}
                        >
                            <Text style={styles.ctaText}>{busy ? 'sending…' : 'send code →'}</Text>
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {SOCIAL_PROVIDERS.map((option) => {
                            const busyProvider = pendingProvider === option.provider;

                            return (
                                <Pressable
                                    disabled={busyProvider}
                                    key={option.provider}
                                    onPress={() => handleSocial(option.provider, option.label)}
                                    style={[styles.altBtn, busyProvider && { opacity: 0.6 }]}
                                >
                                    <IconSymbol
                                        color={palette.violet}
                                        name={option.icon}
                                        size={14}
                                    />
                                    <Text style={styles.altText}>
                                        {busyProvider
                                            ? 'connecting…'
                                            : `Continue with ${option.label}`}
                                    </Text>
                                    <IconSymbol
                                        color={palette.fgDim}
                                        name="chevron.right"
                                        size={13}
                                    />
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.terms}>
                            by continuing you agree to the{'\n'}
                            <Text
                                onPress={() => openLink(TERMS_URL)}
                                style={{ color: palette.violet }}
                            >
                                terms
                            </Text>{' '}
                            ·{' '}
                            <Text
                                onPress={() => openLink(PRIVACY_URL)}
                                style={{ color: palette.violet }}
                            >
                                privacy
                            </Text>{' '}
                            ·{' '}
                            <Text
                                onPress={() => openLink(CODE_OF_CONDUCT_URL)}
                                style={{ color: palette.violet }}
                            >
                                code of conduct
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        altBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 10,
            marginBottom: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        altText: {
            color: palette.fg,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 13,
        },
        backBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderRadius: 8,
            height: 32,
            justifyContent: 'center',
            width: 32,
        },
        body: { padding: 28 },
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
        divider: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
            marginVertical: 22,
        },
        dividerLine: { backgroundColor: palette.bgLine, flex: 1, height: 1 },
        dividerText: { color: palette.fgDim, fontFamily: Fonts.mono, fontSize: 10 },
        fieldLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 8,
        },
        footer: { marginTop: 'auto', padding: 28 },
        input: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            padding: 0,
        },
        inputBox: {
            backgroundColor: palette.bgElev,
            borderColor: palette.violet,
            borderRadius: 10,
            borderWidth: 1.5,
            marginBottom: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
        lede: { color: palette.fgMuted, fontSize: 13, marginBottom: 28, marginTop: 6 },
        root: { backgroundColor: palette.bg, flex: 1 },
        scrollContent: { flexGrow: 1 },
        step: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            marginLeft: 'auto',
        },
        terms: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 11,
            lineHeight: 18,
            textAlign: 'center',
        },
        title: { color: palette.fg, fontSize: 26, fontWeight: '600', letterSpacing: -0.6 },
        topBar: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
    });
