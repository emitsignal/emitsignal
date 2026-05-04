// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
    "arrow.left": "arrow-back",
    "arrow.right": "arrow-forward",
    "arrow.triangle.2.circlepath": "sync",
    // Notifications
    bell: "notifications",

    "bell.badge": "notifications-active",
    "bell.badge.fill": "notifications-active",
    "bell.fill": "notifications",
    "bell.slash": "notifications-off",
    bolt: "bolt",

    "chart.bar": "bar-chart",
    "checkmark.circle.fill": "check-circle",
    "chevron.down": "expand-more",
    "chevron.left.forwardslash.chevron.right": "code",
    "chevron.right": "chevron-right",
    "circle.fill": "circle",

    clock: "schedule",
    "doc.on.doc": "content-copy",
    ellipsis: "more-horiz",
    envelope: "mail",
    "exclamationmark.triangle": "warning",
    eye: "visibility",
    "eye.slash": "visibility-off",

    // Objects
    folder: "folder",
    gear: "settings",
    globe: "public",
    "hand.raised": "privacy-tip",

    // Navigation
    "house.fill": "home",
    // Status
    "info.circle": "info",
    key: "vpn-key",
    "list.bullet": "list",
    magnifyingglass: "search",
    megaphone: "campaign",
    "paperplane.fill": "send",
    // Actions
    plus: "add",
    "server.rack": "dns",
    "speaker.slash": "volume-off",
    // Base Theme
    "square.grid.2x2": "grid-view",
    tag: "label",
    terminal: "terminal",
    xmark: "close",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
    color,
    name,
    size = 24,
    style,
}: {
    color: OpaqueColorValue | string;
    name: IconSymbolName;
    size?: number;
    style?: StyleProp<TextStyle>;
    weight?: SymbolWeight;
}) {
    return <MaterialIcons color={color} name={MAPPING[name]} size={size} style={style} />;
}
