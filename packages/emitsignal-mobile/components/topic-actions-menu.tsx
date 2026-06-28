import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SubscriptionSettingsFields } from '@/components/subscription-settings-fields';
import { type ActionMenuItem, NativeActionMenu } from '@/components/ui/native-action-menu';
import { Fonts, type Palette } from '@/constants/theme';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api, type ListenSince } from '@/lib/api';

export function TopicActionsMenu({ topicName }: { topicName: string }) {
    const { styles } = useThemedStyles(createStyles);
    const { subscriptions, unsubscribe, updateSubscription } = useSubscriptions();
    const subscription = subscriptions.find((item) => item.topic.name === topicName);

    const [description, setDescription] = useState('');
    const [listenSince, setListenSince] = useState<ListenSince>('subscription_date');
    const [pushEnabled, setPushEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSendTest = async () => {
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
        setDescription(subscription.settings.description ?? '');
        setSettingsOpen(true);
    };

    const menuItems = useMemo<ActionMenuItem[]>(() => {
        const actions: ActionMenuItem[] = [
            { icon: 'paperplane.fill', label: 'Send test notification', onPress: handleSendTest },
        ];

        if (subscription) {
            actions.push(
                { icon: 'gear', label: 'Settings', onPress: openSettings },
                {
                    destructive: true,
                    icon: 'rectangle.portrait.and.arrow.right',
                    label: 'Unsubscribe',
                    onPress: handleUnsubscribe,
                },
            );
        }

        return actions;
    }, [subscription]);

    const handleSaveSettings = async () => {
        if (!subscription) {
            return;
        }

        setSaving(true);

        try {
            await updateSubscription({
                id: subscription.id,
                pushEnabled,
                settings: { description: description.trim(), listenSince },
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
            <NativeActionMenu accessibilityLabel="Topic actions" items={menuItems} />

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
                            description={description}
                            descriptionPlaceholder={
                                subscription?.topic.description ??
                                'Add a personal note for this channel'
                            }
                            listenSince={listenSince}
                            onChangeDescription={setDescription}
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

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        cancelBtn: {
            alignItems: 'center',
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flex: 1,
            paddingVertical: 11,
        },
        cancelText: { color: palette.fgMuted, fontSize: 13, fontWeight: '600' },
        saveBtn: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            flex: 1,
            paddingVertical: 11,
        },
        saveText: { color: palette.bg, fontSize: 13, fontWeight: '700' },
        sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
        sheetBackdrop: {
            alignItems: 'center',
            backgroundColor: palette.scrim,
            flex: 1,
            justifyContent: 'center',
            padding: 24,
        },
        sheetCard: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 14,
            borderWidth: StyleSheet.hairlineWidth,
            padding: 20,
            width: '100%',
        },
        sheetTitle: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 15,
            fontWeight: '600',
            marginBottom: 16,
        },
    });
