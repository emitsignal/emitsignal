import { Host, Switch } from '@expo/ui';
import { type StyleProp, type ViewStyle } from 'react-native';

interface NativeSwitchProps {
    disabled?: boolean;
    onValueChange: (value: boolean) => void;
    style?: StyleProp<ViewStyle>;
    value: boolean;
}

/**
 * Cross-platform native toggle backed by `@expo/ui` — renders a SwiftUI `Switch`
 * on iOS and a Jetpack Compose `Switch` on Android. The control uses the OS accent
 * tint rather than the brand violet; that's the intended native look for swapped
 * controls. Wrapped in `Host` so it bridges into the surrounding React Native tree.
 */
export function NativeSwitch({ disabled, onValueChange, style, value }: NativeSwitchProps) {
    return (
        <Host matchContents style={style}>
            <Switch disabled={disabled} onValueChange={onValueChange} value={value} />
        </Host>
    );
}
