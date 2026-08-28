import { parseShareRefusal, shareUrl } from '@emitsignal/shared/share';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api, WEB_URL } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error';

interface MessageShareButtonProps {
    messageId: string;
    title: string;
}

interface Refusal {
    isOwner: boolean;
    topicName: string;
}

export function MessageShareButton({ messageId, title }: MessageShareButtonProps) {
    const { palette, styles } = useThemedStyles(createStyles);
    const [busy, setBusy] = useState(false);
    const [refusal, setRefusal] = useState<null | Refusal>(null);
    const [error, setError] = useState<null | string>(null);

    const share = async () => {
        if (busy) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const { shareId } = await api.createMessageShare(messageId);

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // RN's own Share sheet — expo-sharing only handles files, not URLs.
            await Share.share({ message: `${title}\n\n${shareUrl(WEB_URL, shareId)}` });
        } catch (caught) {
            const parsed = parseShareRefusal(caught);

            if (!parsed) {
                setError(apiErrorMessage(caught, 'Could not create a share link.'));
                setRefusal({ isOwner: false, topicName: '' });
                setBusy(false);

                return;
            }

            setRefusal({
                isOwner: await isTopicOwner(parsed.topicName),
                topicName: parsed.topicName,
            });
        } finally {
            setBusy(false);
        }
    };

    const makePublic = async () => {
        if (!refusal) {
            return;
        }

        setBusy(true);

        try {
            await api.updateTopic(refusal.topicName, { accessMode: 'public' });

            setRefusal(null);
            setBusy(false);

            await share();
        } catch (caught) {
            setError(apiErrorMessage(caught, 'Could not update the topic.'));
            setBusy(false);
        }
    };

    const dismiss = () => {
        setRefusal(null);
        setError(null);
    };

    return (
        <>
            <Pressable
                accessibilityLabel="Share this message"
                disabled={busy}
                onPress={share}
                style={styles.shareBtn}
            >
                <IconSymbol color={palette.fg} name="square.and.arrow.up" size={16} />
            </Pressable>

            <Modal
                animationType="fade"
                onRequestClose={dismiss}
                transparent
                visible={refusal !== null}
            >
                <Pressable onPress={dismiss} style={styles.sheetBackdrop}>
                    <Pressable onPress={() => {}} style={styles.sheetCard}>
                        <Text style={styles.sheetTitle}>
                            {error ? 'Share failed' : 'This topic is private'}
                        </Text>

                        <Text style={styles.sheetBody}>
                            {error ??
                                `A public share link only works for public topics. Make ${refusal?.topicName} public to share this message outside your workspace.`}
                        </Text>

                        <View style={styles.sheetActions}>
                            <Pressable onPress={dismiss} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>
                                    {refusal?.isOwner ? 'Cancel' : 'Close'}
                                </Text>
                            </Pressable>

                            {refusal?.isOwner && !error && (
                                <Pressable
                                    disabled={busy}
                                    onPress={makePublic}
                                    style={styles.saveBtn}
                                >
                                    <Text style={styles.saveText}>
                                        {busy ? 'Working…' : 'Make public'}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

async function isTopicOwner(topicName: string): Promise<boolean> {
    try {
        return Boolean((await api.getTopic(topicName)).isOwner);
    } catch {
        return false;
    }
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        cancelBtn: {
            alignItems: 'center',
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flex: 1,
            paddingVertical: 11,
        },
        cancelText: { color: palette.fgMuted, fontSize: 13, fontWeight: '600' },
        saveBtn: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            flex: 1,
            paddingVertical: 11,
        },
        saveText: { color: palette.bg, fontSize: 13, fontWeight: '700' },
        shareBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderRadius: 8,
            height: 32,
            justifyContent: 'center',
            width: 32,
        },
        sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
        sheetBackdrop: {
            alignItems: 'center',
            backgroundColor: palette.scrim,
            flex: 1,
            justifyContent: 'center',
            padding: 24,
        },
        sheetBody: { color: palette.fgMuted, fontSize: 13, lineHeight: 19 },
        sheetCard: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 14,
            borderWidth: StyleSheet.hairlineWidth,
            padding: 20,
            width: '100%',
        },
        sheetTitle: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 15,
            fontWeight: '600',
            marginBottom: 10,
        },
    });
