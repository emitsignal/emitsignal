import { StyleSheet, Text, type TextProps } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = {
    darkColor?: string;
    lightColor?: string;
    type?: 'default' | 'defaultSemiBold' | 'link' | 'subtitle' | 'title';
} & TextProps;

export function ThemedText({
    darkColor,
    lightColor,
    style,
    type = 'default',
    ...rest
}: ThemedTextProps) {
    const color = useThemeColor({ dark: darkColor, light: lightColor }, 'text');
    const palette = usePalette();

    return (
        <Text
            style={[
                { color },
                type === 'default' ? styles.default : undefined,
                type === 'title' ? styles.title : undefined,
                type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                type === 'subtitle' ? styles.subtitle : undefined,
                type === 'link' ? [styles.link, { color: palette.link }] : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    defaultSemiBold: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    link: {
        fontSize: 16,
        lineHeight: 30,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 32,
    },
});
