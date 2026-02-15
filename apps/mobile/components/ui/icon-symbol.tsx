// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'arrow.left': 'arrow-back',
  'chevron.left.forwardslash.chevron.right': 'code',

  // Notifications
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'bell.badge': 'notifications-active',
  'bell.badge.fill': 'notifications-active',
  'bell.slash': 'notifications-off',

  // Actions
  'plus': 'add',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'ellipsis': 'more-horiz',
  'checkmark.circle.fill': 'check-circle',
  'paperplane.fill': 'send',

  // Objects
  'folder': 'folder',
  'globe': 'public',
  'server.rack': 'dns',
  'envelope': 'mail',
  'megaphone': 'campaign',
  'chart.bar': 'bar-chart',
  'list.bullet': 'list',

  // Status
  'info.circle': 'info',
  'hand.raised': 'privacy-tip',
  'exclamationmark.triangle': 'warning',
  'arrow.triangle.2.circlepath': 'sync',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
