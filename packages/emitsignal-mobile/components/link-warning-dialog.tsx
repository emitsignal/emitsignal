import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MediaRef } from '@/lib/api';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';

interface Props {
    link: MediaRef | null;
    onClose: () => void;
}

export function LinkWarningDialog({ link, onClose }: Props) {
    const handleOpen = () => {
        if (!link) {
            return;
        }

        Linking.openURL(link.href).catch(() => {});

        onClose();
    };

    return (
        <Modal animationType="fade" onRequestClose={onClose} transparent visible={link !== null}>
            <Pressable onPress={onClose} style={styles.backdrop}>
                <Pressable onPress={() => {}} style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconWrap}>
                            <IconSymbol color={W.amber} name="exclamationmark.triangle" size={18} />
                        </View>
                        <Text style={styles.title}>External link</Text>
                    </View>

                    <Text style={styles.body}>
                        You&apos;re about to open a link that is{' '}
                        <Text style={styles.bodyStrong}>not managed or verified by EmitSignal</Text>
                        . Check it below — you&apos;re opening it at your own risk.
                    </Text>

                    {link?.title && <Text style={styles.linkTitle}>{link.title}</Text>}

                    <ScrollView style={styles.urlBox}>
                        <Text style={styles.url}>{link?.href}</Text>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Pressable onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleOpen} style={styles.openBtn}>
                            <IconSymbol color={W.bg} name="link" size={14} />
                            <Text style={styles.openText}>Open link</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
    },
    backdrop: {
        alignItems: 'center',
        backgroundColor: 'rgba(6,3,15,0.72)',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    body: {
        color: W.fgMuted,
        fontSize: 13.5,
        lineHeight: 20,
    },
    bodyStrong: {
        color: W.fg,
        fontWeight: '600',
    },
    cancelBtn: {
        alignItems: 'center',
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flex: 1,
        paddingVertical: 11,
    },
    cancelText: {
        color: W.fgMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 20,
        width: '100%',
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    iconWrap: {
        alignItems: 'center',
        backgroundColor: 'rgba(251,191,36,0.13)',
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    linkTitle: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 12,
        marginTop: 14,
    },
    openBtn: {
        alignItems: 'center',
        backgroundColor: W.amber,
        borderRadius: 10,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        paddingVertical: 11,
    },
    openText: {
        color: W.bg,
        fontSize: 13,
        fontWeight: '700',
    },
    title: {
        color: W.fg,
        fontSize: 16,
        fontWeight: '600',
    },
    url: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 12,
        lineHeight: 18,
    },
    urlBox: {
        backgroundColor: W.bg,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        marginTop: 10,
        maxHeight: 120,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
