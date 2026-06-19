import { type ComponentProps, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { W } from '@/constants/theme';

export interface ActionMenuItem {
    destructive?: boolean;
    icon: ComponentProps<typeof IconSymbol>['name'];
    label: string;
    onPress: () => void;
}

interface NativeActionMenuProps {
    accessibilityLabel?: string;
    items: ActionMenuItem[];
}

/**
 * Fallback (Android / web) implementation of the topic actions menu. iOS uses a
 * native SwiftUI `Menu` (see native-action-menu.ios.tsx); here we keep the proven
 * React Native modal dropdown so non-iOS platforms are unaffected by the @expo/ui
 * swift-ui import. The menu closes itself once an item is pressed.
 */
export function NativeActionMenu({ accessibilityLabel, items }: NativeActionMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                accessibilityLabel={accessibilityLabel}
                onPress={() => setOpen(true)}
                style={styles.trigger}
            >
                <IconSymbol color={W.fgDim} name="ellipsis" size={20} />
            </Pressable>

            <Modal
                animationType="fade"
                onRequestClose={() => setOpen(false)}
                transparent
                visible={open}
            >
                <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
                    <Pressable onPress={() => {}} style={styles.card}>
                        {items.map((item) => (
                            <Pressable
                                key={item.label}
                                onPress={() => {
                                    setOpen(false);
                                    item.onPress();
                                }}
                                style={styles.row}
                            >
                                <IconSymbol
                                    color={item.destructive ? W.red : W.fg}
                                    name={item.icon}
                                    size={16}
                                />
                                <Text style={[styles.label, item.destructive && { color: W.red }]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 52,
    },
    card: {
        alignSelf: 'flex-end',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        minWidth: 230,
        overflow: 'hidden',
    },
    label: { color: W.fg, fontSize: 14 },
    row: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    trigger: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
});
