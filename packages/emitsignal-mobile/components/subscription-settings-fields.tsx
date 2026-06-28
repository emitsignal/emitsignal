import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { NativeSwitch } from '@/components/ui/native-switch';
import { Fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { type ListenSince } from '@/lib/api';

const DESCRIPTION_MAX_LENGTH = 280;

interface Props {
    description: string;
    descriptionPlaceholder?: string;
    listenSince: ListenSince;
    onChangeDescription: (value: string) => void;
    onChangeListenSince: (value: ListenSince) => void;
    onChangePushEnabled: (value: boolean) => void;
    pushEnabled: boolean;
}

const LISTEN_SINCE_OPTIONS: {
    description: string;
    label: string;
    value: ListenSince;
}[] = [
    {
        description: 'Only messages published after you subscribe',
        label: 'New messages only',
        value: 'subscription_date',
    },
    {
        description: 'Include messages from before you subscribed',
        label: 'Include past messages',
        value: 'always',
    },
];

export function SubscriptionSettingsFields({
    description,
    descriptionPlaceholder,
    listenSince,
    onChangeDescription,
    onChangeListenSince,
    onChangePushEnabled,
    pushEnabled,
}: Props) {
    const { palette, styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.group}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <TextInput
                maxLength={DESCRIPTION_MAX_LENGTH}
                onChangeText={onChangeDescription}
                placeholder={descriptionPlaceholder ?? 'Add a personal note for this channel'}
                placeholderTextColor={palette.fgDim}
                style={styles.descriptionInput}
                value={description}
            />

            <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>Push notifications</Text>
                    <Text style={styles.rowHint}>Get notified when messages arrive</Text>
                </View>
                <NativeSwitch onValueChange={onChangePushEnabled} value={pushEnabled} />
            </View>

            <Text style={styles.sectionLabel}>SHOW MESSAGES</Text>
            {LISTEN_SINCE_OPTIONS.map((option) => {
                const selected = option.value === listenSince;

                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChangeListenSince(option.value)}
                        style={[styles.optionRow, selected && styles.optionRowActive]}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>{option.label}</Text>
                            <Text style={styles.rowHint}>{option.description}</Text>
                        </View>

                        {selected ? (
                            <IconSymbol
                                color={palette.violet}
                                name="checkmark.circle.fill"
                                size={18}
                            />
                        ) : (
                            <View style={styles.radioEmpty} />
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        descriptionInput: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            color: palette.fg,
            fontSize: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        group: { gap: 8 },
        optionRow: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        optionRowActive: { backgroundColor: palette.violetBg, borderColor: palette.violet },
        radioEmpty: {
            borderColor: palette.bgLine,
            borderRadius: 9,
            borderWidth: 1.5,
            height: 18,
            width: 18,
        },
        rowHint: {
            color: palette.fgDim,
            fontSize: 11.5,
            marginTop: 2,
        },
        rowLabel: { color: palette.fg, fontSize: 14 },
        sectionLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 11,
            letterSpacing: 1.2,
            marginBottom: 4,
            marginTop: 4,
        },
        switchRow: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
    });
