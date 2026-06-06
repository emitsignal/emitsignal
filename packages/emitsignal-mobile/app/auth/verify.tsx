import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
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
import { Fonts, W } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

export default function AuthVerify() {
    const [busy, setBusy] = useState(false);
    const [otp, setOtp] = useState('');
    const inputRef = useRef<TextInput>(null);
    const params = useLocalSearchParams<{ email?: string }>();

    const email = params.email ?? '';

    const handleVerify = async () => {
        if (otp.length < 6) {
            return;
        }

        setBusy(true);

        const { error } = await authClient.signIn.emailOtp({ email, otp });

        setBusy(false);

        if (error) {
            return Alert.alert('Sign-in failed', error.message ?? 'Invalid or expired code');
        }

        router.push('/auth/perms');
    };

    const cells = Array.from({ length: 6 }, (_, i) => otp[i] ?? '');

    const activeIdx = otp.length;

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.topBar}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <IconSymbol color={W.fg} name="arrow.left" size={16} />
                    </Pressable>
                    <WLogo pulse size={11} />
                    <Text style={styles.step}>02/05</Text>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.lede}>
                        We sent a 6-digit code to{' '}
                        <Text style={styles.mono}>{email || 'your email'}</Text>. Tap the link or
                        paste the code here.
                    </Text>

                    <Text style={styles.fieldLabel}>CODE</Text>
                    <Pressable onPress={() => inputRef.current?.focus()} style={styles.codeRow}>
                        {cells.map((c, i) => (
                            <View
                                key={i}
                                style={[styles.codeCell, i === activeIdx && styles.codeCellActive]}
                            >
                                <Text style={styles.codeChar}>{c}</Text>
                            </View>
                        ))}
                        <TextInput
                            keyboardType="number-pad"
                            maxLength={6}
                            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                            ref={inputRef}
                            style={styles.hiddenInput}
                            value={otp}
                        />
                    </Pressable>

                    <Text style={styles.expires}>
                        expires in <Text style={{ color: W.amber }}>10 min</Text>
                    </Text>

                    <Pressable
                        disabled={busy || otp.length < 6}
                        onPress={handleVerify}
                        style={[styles.cta, (busy || otp.length < 6) && styles.ctaDisabled]}
                    >
                        <Text style={[styles.ctaText, otp.length < 6 && { color: W.fgDim }]}>
                            {busy ? 'verifying…' : 'sign in →'}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.resend}>
                        {"didn't arrive? "}
                        <Text onPress={() => router.back()} style={{ color: W.violet }}>
                            resend
                        </Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
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
    codeCell: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: 1.5,
        height: 56,
        justifyContent: 'center',
        width: 48,
    },
    codeCellActive: { borderColor: W.violet },
    codeChar: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 20,
        fontWeight: '600',
    },
    codeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    cta: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        paddingVertical: 14,
    },
    ctaDisabled: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
    },
    ctaText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    expires: { color: W.fgDim, fontFamily: Fonts.mono, fontSize: 11, marginBottom: 24 },
    fieldLabel: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    footer: { padding: 28 },
    hiddenInput: {
        height: 1,
        opacity: 0,
        position: 'absolute',
        width: 1,
    },
    lede: { color: W.fgMuted, fontSize: 13, marginBottom: 28, marginTop: 6 },
    mono: { color: W.fg, fontFamily: Fonts.mono },
    resend: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 12,
        textAlign: 'center',
    },
    root: { backgroundColor: W.bg, flex: 1 },
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
