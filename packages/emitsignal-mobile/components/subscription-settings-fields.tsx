import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { type ListenSince } from '@/lib/api';

interface Props {
    listenSince: ListenSince;
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
    listenSince,
    onChangeListenSince,
    onChangePushEnabled,
    pushEnabled,
}: Props) {
    return (
        <View style={styles.group}>
            <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>Push notifications</Text>
                    <Text style={styles.rowHint}>Get notified when messages arrive</Text>
                </View>
                <Switch
                    onValueChange={onChangePushEnabled}
                    thumbColor={W.fg}
                    trackColor={{ false: W.bgLine, true: W.violet }}
                    value={pushEnabled}
                />
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
                            <IconSymbol color={W.violet} name="checkmark.circle.fill" size={18} />
                        ) : (
                            <View style={styles.radioEmpty} />
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    group: { gap: 8 },
    optionRow: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    optionRowActive: { backgroundColor: W.violetBg, borderColor: W.violet },
    radioEmpty: {
        borderColor: W.bgLine,
        borderRadius: 9,
        borderWidth: 1.5,
        height: 18,
        width: 18,
    },
    rowHint: {
        color: W.fgDim,
        fontSize: 11.5,
        marginTop: 2,
    },
    rowLabel: { color: W.fg, fontSize: 14 },
    sectionLabel: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        letterSpacing: 1.2,
        marginBottom: 4,
        marginTop: 4,
    },
    switchRow: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
