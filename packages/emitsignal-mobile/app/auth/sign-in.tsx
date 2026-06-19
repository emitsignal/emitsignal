import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { authClient } from '@/lib/auth-client';

export default function AuthSignIn() {
    const { palette, styles } = useThemedStyles(createStyles);
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);

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

                    {[
                        { icon: 'globe' as const, label: 'continue with GitHub' },
                        { icon: 'key' as const, label: 'continue with Apple' },
                    ].map((option) => (
                        <Pressable key={option.label} onPress={handleSend} style={styles.altBtn}>
                            <IconSymbol color={palette.violet} name={option.icon} size={14} />
                            <Text style={styles.altText}>{option.label}</Text>
                            <IconSymbol color={palette.fgDim} name="chevron.right" size={13} />
                        </Pressable>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.terms}>
                        by continuing you agree to the{'\n'}
                        <Text style={{ color: palette.violet }}>terms</Text> ·{' '}
                        <Text style={{ color: palette.violet }}>privacy</Text> ·{' '}
                        <Text style={{ color: palette.violet }}>acceptable use</Text>
                    </Text>
                </View>
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
        footer: { padding: 28 },
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
