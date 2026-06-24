import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
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
import { useSession } from '@/ctx/session';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { API_URL, getAuthToken } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export default function AuthAvatar() {
    const { palette, styles } = useThemedStyles(createStyles);
    const { user } = useSession();
    const [localUri, setLocalUri] = useState<null | string>(null);
    const [name, setName] = useState(user?.name ?? '');
    const [busy, setBusy] = useState(false);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            mediaTypes: 'images',
            quality: 0.85,
        });

        if (!result.canceled && result.assets[0]) {
            setLocalUri(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (): Promise<string | undefined> => {
        try {
            const token = getAuthToken();

            if (!token) {
                return;
            }

            const form = new FormData();
            const file = new File(localUri as string);

            form.append('file', file as unknown as Blob, file.name);

            const response = await fetch(`${API_URL}/user/avatar`, {
                body: form,
                headers: { Authorization: `Bearer ${token}` },
                method: 'POST',
            });

            if (response.ok) {
                const data = (await response.json()) as { imageUrl: string };

                return data.imageUrl;
            }
        } catch (error) {
            console.error(error);
        }

        return undefined;
    };

    const handleContinue = async () => {
        setBusy(true);

        const payload: { image?: string; name?: string } = {};

        try {
            if (localUri) {
                const imageUrl = await uploadAvatar();

                if (imageUrl) {
                    payload.image = imageUrl;
                }
            }

            if (name.trim() && name.trim() !== user?.name) {
                payload.name = name.trim();
            }

            if (Object.keys(payload).length > 0) {
                await authClient.updateUser(payload);
            }
        } finally {
            router.replace('/auth/first-channels');

            setBusy(false);
        }
    };

    const handleSkip = () => {
        router.replace('/auth/first-channels');
    };

    const initials = (user?.name ?? user?.email ?? '?')
        .replace(/[^a-z0-9 ]/gi, '')
        .split(' ')
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('');

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
                    <Text style={styles.step}>04/05</Text>
                </View>

                <View style={styles.body}>
                    <View style={styles.hero}>
                        <Pressable onPress={handlePickImage} style={styles.avatarWrap}>
                            {localUri ? (
                                <Image
                                    contentFit="cover"
                                    source={{ uri: localUri }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                </View>
                            )}
                            <View style={styles.cameraBtn}>
                                <IconSymbol color={palette.bg} name="camera.fill" size={13} />
                            </View>
                        </Pressable>

                        <Text style={styles.hint}>tap to choose a photo</Text>
                    </View>

                    <Text style={styles.nameLabel}>NAME</Text>
                    <View style={styles.inputBox}>
                        <TextInput
                            autoCorrect={false}
                            onChangeText={setName}
                            placeholder="your name"
                            placeholderTextColor={palette.fgDim}
                            style={styles.input}
                            value={name}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Pressable
                        disabled={busy}
                        onPress={handleContinue}
                        style={[styles.cta, busy && { opacity: 0.6 }]}
                    >
                        {busy ? (
                            <ActivityIndicator color={palette.bg} size="small" />
                        ) : (
                            <>
                                <Text style={styles.ctaText}>continue</Text>
                                <IconSymbol color={palette.bg} name="arrow.right" size={14} />
                            </>
                        )}
                    </Pressable>

                    <Pressable onPress={handleSkip} style={styles.skipBtn}>
                        <Text style={styles.skipText}>skip for now</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const AVATAR_SIZE = 120;

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        avatarImage: {
            borderRadius: AVATAR_SIZE / 2,
            height: AVATAR_SIZE,
            width: AVATAR_SIZE,
        },
        avatarInitials: {
            color: palette.violet,
            fontFamily: Fonts.mono,
            fontSize: AVATAR_SIZE * 0.32,
            fontWeight: '600',
            letterSpacing: -1,
        },
        avatarPlaceholder: {
            alignItems: 'center',
            backgroundColor: palette.violetBg,
            borderColor: `${palette.violet}55`,
            borderRadius: AVATAR_SIZE / 2,
            borderWidth: 1.5,
            height: AVATAR_SIZE,
            justifyContent: 'center',
            width: AVATAR_SIZE,
        },
        avatarWrap: {
            position: 'relative',
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
        cameraBtn: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderColor: palette.bg,
            borderRadius: 18,
            borderWidth: 2,
            bottom: 2,
            height: 32,
            justifyContent: 'center',
            position: 'absolute',
            right: 2,
            width: 32,
        },
        cta: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
            paddingVertical: 14,
        },
        ctaText: {
            color: palette.bg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        footer: { gap: 12, padding: 28 },
        hero: {
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            paddingBottom: 40,
        },
        hint: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 11,
            marginTop: 14,
        },
        input: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            padding: 0,
        },
        inputBox: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: 1.5,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
        nameLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 8,
        },
        root: { backgroundColor: palette.bg, flex: 1 },
        skipBtn: { alignItems: 'center', paddingVertical: 4 },
        skipText: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 12,
        },
        step: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            marginLeft: 'auto',
        },
        topBar: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
    });
