import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment } from '@/lib/api';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatSize } from '@/lib/format';

interface Props {
    attachment: Attachment;
    onPress?: () => void;
}

export function AttachmentPreview({ attachment, onPress }: Props) {
    const { palette, styles } = useThemedStyles(createStyles);

    const handleOpen = () => {
        if (onPress) {
            onPress();
            return;
        }
        Linking.openURL(attachment.url).catch(() => {});
    };

    return (
        <Pressable onPress={handleOpen} style={styles.container}>
            {isImage(attachment.mimeType) ? (
                <Image
                    contentFit="cover"
                    source={{ uri: attachment.url }}
                    style={styles.image}
                    transition={200}
                />
            ) : (
                <View style={styles.fileIcon}>
                    <IconSymbol color={palette.fgDim} name="doc.text" size={24} />
                </View>
            )}
            <View style={styles.info}>
                <Text numberOfLines={1} style={styles.filename}>
                    {attachment.filename}
                </Text>
                <Text style={styles.meta}>{formatSize(attachment.size)}</Text>
            </View>
            <IconSymbol color={palette.fgDim} name="arrow.down.to.line" size={14} />
        </Pressable>
    );
}

function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        container: {
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
        fileIcon: {
            alignItems: 'center',
            backgroundColor: palette.bgElev2,
            borderRadius: 6,
            height: 44,
            justifyContent: 'center',
            width: 44,
        },
        filename: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 12,
        },
        image: {
            backgroundColor: palette.bgElev2,
            borderRadius: 6,
            height: 44,
            width: 44,
        },
        info: {
            flex: 1,
        },
        meta: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            marginTop: 2,
        },
    });
