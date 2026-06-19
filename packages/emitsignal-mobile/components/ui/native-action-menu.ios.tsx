import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { background, contentShape, cornerRadius, frame, shapes } from '@expo/ui/swift-ui/modifiers';
import { type ComponentProps } from 'react';

import { type ActionMenuItem } from '@/components/ui/native-action-menu';
import { usePalette } from '@/hooks/use-palette';

interface NativeActionMenuProps {
    accessibilityLabel?: string;
    items: ActionMenuItem[];
}

type SystemImage = ComponentProps<typeof Button>['systemImage'];

/**
 * iOS topic actions menu backed by a native SwiftUI `Menu`. A single tap on the
 * ellipsis opens the menu; each item maps to a native `Button` (destructive
 * actions use the `destructive` role). Other platforms use the React Native
 * fallback in native-action-menu.tsx.
 *
 * The trigger uses a custom label — a muted ellipsis in a bgElev rounded square —
 * so it matches the rest of the UI (the default `systemImage` trigger renders in
 * the system accent color) and gives the full 32×32 square a tappable hit area.
 */
export function NativeActionMenu({ items }: NativeActionMenuProps) {
    const palette = usePalette();

    return (
        <Host matchContents>
            <Menu
                label={
                    <Image
                        color={palette.fgDim}
                        modifiers={[
                            frame({ height: 32, width: 32 }),
                            background(palette.bgElev),
                            cornerRadius(8),
                            contentShape(shapes.rectangle()),
                        ]}
                        size={20}
                        systemName="ellipsis"
                    />
                }
            >
                {items.map((item) => (
                    <Button
                        key={item.label}
                        label={item.label}
                        onPress={item.onPress}
                        role={item.destructive ? 'destructive' : 'default'}
                        systemImage={item.icon as SystemImage}
                    />
                ))}
            </Menu>
        </Host>
    );
}
