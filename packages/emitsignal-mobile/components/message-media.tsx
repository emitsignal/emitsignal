import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MediaRef } from '@/lib/api';

import { LinkWarningDialog } from '@/components/link-warning-dialog';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

interface Props {
    bannerImage: MediaRef | null;
    inlineAttachments: MediaRef[];
    inlineImages: MediaRef[];
}

export function MessageMedia({ bannerImage, inlineAttachments, inlineImages }: Props) {
    const { palette, styles } = useThemedStyles(createStyles);
    const [pendingLink, setPendingLink] = useState<MediaRef | null>(null);

    if (!bannerImage && inlineImages.length === 0 && inlineAttachments.length === 0) {
        return null;
    }

    const gallery = [...(bannerImage ? [bannerImage] : []), ...inlineImages];

    const openImage = (startIndex: number) =>
        router.push({
            params: {
                gallery: JSON.stringify(
                    gallery.map((image) => ({ filename: image.title ?? '', url: image.href })),
                ),
                index: String(startIndex),
            },
            pathname: '/image-viewer',
        });

    return (
        <View style={styles.wrap}>
            {bannerImage && (
                <Pressable onPress={() => openImage(0)}>
                    <Image
                        contentFit="cover"
                        source={{ uri: bannerImage.href }}
                        style={styles.banner}
                        transition={200}
                    />
                </Pressable>
            )}

            {inlineAttachments.map((attachment, index) => (
                <Pressable
                    key={index}
                    onPress={() => setPendingLink(attachment)}
                    style={styles.linkRow}
                >
                    <IconSymbol color={palette.fgDim} name="link" size={16} />
                    <Text numberOfLines={1} style={styles.linkText}>
                        {attachment.title ?? attachment.href}
                    </Text>
                    <IconSymbol color={palette.fgDim} name="arrow.right" size={14} />
                </Pressable>
            ))}

            {inlineImages.length > 0 && (
                <View style={styles.imageRow}>
                    {inlineImages.map((image, index) => (
                        <Pressable
                            key={index}
                            onPress={() => openImage((bannerImage ? 1 : 0) + index)}
                        >
                            <Image
                                contentFit="cover"
                                source={{ uri: image.href }}
                                style={styles.thumb}
                                transition={200}
                            />
                        </Pressable>
                    ))}
                </View>
            )}

            <LinkWarningDialog link={pendingLink} onClose={() => setPendingLink(null)} />
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        banner: {
            backgroundColor: palette.bgElev2,
            borderRadius: 10,
            height: 180,
            width: '100%',
        },
        imageRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        linkRow: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        linkText: {
            color: palette.fg,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 12,
        },
        thumb: {
            backgroundColor: palette.bgElev2,
            borderRadius: 8,
            height: 88,
            width: 88,
        },
        wrap: {
            gap: 10,
            marginTop: 14,
        },
    });
