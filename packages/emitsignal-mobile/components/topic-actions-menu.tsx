import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SubscriptionSettingsFields } from '@/components/subscription-settings-fields';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { api, type ListenSince } from '@/lib/api';

export function TopicActionsMenu({ topicName }: { topicName: string }) {
    const { subscriptions, unsubscribe, updateSubscription } = useSubscriptions();
    const subscription = subscriptions.find((item) => item.topic.name === topicName);

    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [listenSince, setListenSince] = useState<ListenSince>('subscription_date');
    const [saving, setSaving] = useState(false);

    const handleSendTest = async () => {
        setMenuOpen(false);

        try {
            await api.publish(topicName, {
                body: 'This is a test from EmitSignal',
                priority: 3,
                tags: ['test'],
                title: 'Test notification',
            });

            Alert.alert('Sent', `→ ${topicName}`);
        } catch (error) {
            Alert.alert('Failed', error instanceof Error ? error.message : String(error));
        }
    };

    const handleUnsubscribe = () => {
        setMenuOpen(false);

        Alert.alert('Unsubscribe', `Stop receiving messages from ${topicName}?`, [
            { style: 'cancel', text: 'Cancel' },
            {
                onPress: () => {
                    void unsubscribe(topicName).then(() => router.back());
                },
                style: 'destructive',
                text: 'Unsubscribe',
            },
        ]);
    };

    const openSettings = () => {
        if (!subscription) {
            return;
        }

        setPushEnabled(subscription.pushEnabled);
        setListenSince(subscription.settings.listenSince);
        setMenuOpen(false);
        setSettingsOpen(true);
    };

    const handleSaveSettings = async () => {
        if (!subscription) {
            return;
        }

        setSaving(true);

        try {
            await updateSubscription({
                id: subscription.id,
                pushEnabled,
                settings: { listenSince },
            });

            setSettingsOpen(false);
        } catch (error) {
            Alert.alert('Failed', error instanceof Error ? error.message : String(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Pressable
                accessibilityLabel="Topic actions"
                onPress={() => setMenuOpen(true)}
                style={styles.trigger}
            >
                <IconSymbol color={W.fgDim} name="ellipsis" size={20} />
            </Pressable>

            <Modal
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
                transparent
                visible={menuOpen}
            >
                <Pressable onPress={() => setMenuOpen(false)} style={styles.menuBackdrop}>
                    <Pressable onPress={() => {}} style={styles.menuCard}>
                        <MenuRow
                            icon="paperplane.fill"
                            label="Send test notification"
                            onPress={handleSendTest}
                        />

                        {subscription ? (
                            <>
                                <MenuRow icon="gear" label="Settings" onPress={openSettings} />
                                <MenuRow
                                    destructive
                                    icon="rectangle.portrait.and.arrow.right"
                                    label="Unsubscribe"
                                    onPress={handleUnsubscribe}
                                />
                            </>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                onRequestClose={() => setSettingsOpen(false)}
                transparent
                visible={settingsOpen}
            >
                <Pressable onPress={() => setSettingsOpen(false)} style={styles.sheetBackdrop}>
                    <Pressable onPress={() => {}} style={styles.sheetCard}>
                        <Text style={styles.sheetTitle}>{topicName}</Text>
                        <SubscriptionSettingsFields
                            listenSince={listenSince}
                            onChangeListenSince={setListenSince}
                            onChangePushEnabled={setPushEnabled}
                            pushEnabled={pushEnabled}
                        />
                        <View style={styles.sheetActions}>
                            <Pressable
                                onPress={() => setSettingsOpen(false)}
                                style={styles.cancelBtn}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                disabled={saving}
                                onPress={handleSaveSettings}
                                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                            >
                                <Text style={styles.saveText}>{saving ? 'saving…' : 'Save'}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

function MenuRow({
    destructive,
    icon,
    label,
    onPress,
}: {
    destructive?: boolean;
    icon: ComponentProps<typeof IconSymbol>['name'];
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={styles.menuRow}>
            <IconSymbol color={destructive ? W.red : W.fg} name={icon} size={16} />
            <Text style={[styles.menuLabel, destructive && { color: W.red }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cancelBtn: {
        alignItems: 'center',
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flex: 1,
        paddingVertical: 11,
    },
    cancelText: { color: W.fgMuted, fontSize: 13, fontWeight: '600' },
    menuBackdrop: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 52,
    },
    menuCard: {
        alignSelf: 'flex-end',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        minWidth: 230,
        overflow: 'hidden',
    },
    menuLabel: { color: W.fg, fontSize: 14 },
    menuRow: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    saveBtn: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        flex: 1,
        paddingVertical: 11,
    },
    saveText: { color: W.bg, fontSize: 13, fontWeight: '700' },
    sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    sheetBackdrop: {
        alignItems: 'center',
        backgroundColor: 'rgba(6,3,15,0.72)',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    sheetCard: {
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 20,
        width: '100%',
    },
    sheetTitle: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 16,
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
