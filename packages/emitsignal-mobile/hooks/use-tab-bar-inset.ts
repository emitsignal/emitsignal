import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Content height of the floating NativeTabs (Liquid Glass) bar, excluding the
// device bottom safe-area inset which is added on top. Tune if items still clip.
const TAB_BAR_HEIGHT = 32;

/**
 * Bottom padding a tab screen's scroll content needs so its last items clear
 * the floating translucent NativeTabs bar (SDK 56). The bar overlays content
 * and screens use `SafeAreaView edges={['top']}`, so the bottom inset is added
 * manually here. Pass `extra` for screens with overlay elements (e.g. a FAB).
 */
export function useTabBarInset(extra = 0): number {
    const insets = useSafeAreaInsets();
    return insets.bottom + TAB_BAR_HEIGHT + extra;
}
