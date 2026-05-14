import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = {
    darkColor?: string;
    lightColor?: string;
} & ViewProps;

export function ThemedView({ darkColor, lightColor, style, ...otherProps }: ThemedViewProps) {
    const backgroundColor = useThemeColor({ dark: darkColor, light: lightColor }, 'background');

    return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
