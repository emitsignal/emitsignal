import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { goBackOrHome } from '@/lib/navigation';

interface ScreenHeaderProps {
    altName?: string;
    onBack?: () => void;
    right?: ReactNode;
    subtitle?: string;
    title: string;
}

export function ScreenHeader({
    title,
    altName = title,
    onBack,
    right,
    subtitle,
}: ScreenHeaderProps) {
    const { palette, styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.topBar}>
            <Pressable onPress={onBack ?? goBackOrHome} style={styles.backBtn}>
                <IconSymbol color={palette.fg} name="arrow.left" size={16} />
            </Pressable>

            {altName && <WTopicAvatar name={altName} rounded={6} size={32} />}

            <View style={styles.titleWrap}>
                <Text numberOfLines={1} style={styles.title}>
                    {title}
                </Text>

                {subtitle && (
                    <Text numberOfLines={1} style={styles.subtitle}>
                        {subtitle}
                    </Text>
                )}
            </View>

            {right ?? null}
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
        subtitle: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
            marginTop: 2,
        },
        title: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        titleWrap: { flex: 1 },
        topBar: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
    });
