import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WChip, WCode, WDot, WLogo } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, PriorityColors, W } from '@/constants/theme';
import { useDevice } from '@/ctx/device';
import { api, type Message, type Topic } from '@/lib/api';

export default function MessageDetailScreen() {
    const [ackCount, setAckCount] = useState(0);
    const [acknowledged, setAcknowledged] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [topic, setTopic] = useState<null | Topic>(null);
    const { deviceId } = useDevice();
    const { id } = useLocalSearchParams<{ id: string }>();

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const allTopics = await api.listTopics();

            for (const topic of allTopics) {
                const messages = await api.listMessages(topic.name, 200);
                const found = messages.find((message) => message.id === id);

                if (found && !cancelled) {
                    setMessage(found);
                    setTopic(topic);
                    setAckCount(found.acknowledgmentCount);

                    return;
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleAcknowledge = async () => {
        if (acknowledged || !deviceId) {
            return;
        }

        try {
            const result = await api.acknowledgeMessage(id, deviceId);

            setAcknowledged(true);
            setAckCount(result.count);
        } catch (error) {
            console.warn('Acknowledge failed:', error);
        }
    };

    const handleView = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.warn('Failed to open URL:', error);
        }
    };

    if (!message || !topic) {
        return (
            <SafeAreaView style={styles.root}>
                <Text style={styles.loading}>loading…</Text>
            </SafeAreaView>
        );
    }

    const priority = message.priority;

    const priorityLabel =
        priority >= 5 ? 'max' : priority === 4 ? 'high' : priority === 3 ? 'default' : 'low';

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <IconSymbol color={W.fg} name="arrow.left" size={16} />
                </Pressable>
                <WLogo pulse size={11} />
                <Text style={styles.channelLabel}>{topic.name}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.hero}>
                    <View style={styles.prioRow}>
                        <WDot level={priority} size={8} />
                        <Text style={[styles.priorityText, { color: PriorityColors[priority] }]}>
                            priority {priority} · {priorityLabel}
                        </Text>
                    </View>

                    <Text style={styles.title}>{message.title}</Text>
                    <Text style={styles.body}>{message.body}</Text>

                    <View style={styles.tagsRow}>
                        {message.tags.map((tag) => (
                            <WChip key={tag}>{`#${tag}`}</WChip>
                        ))}
                    </View>

                    {message.actions.length > 0 ? (
                        <View style={styles.actions}>
                            {message.actions.map((action, i) => {
                                if (action.type === 'acknowledge') {
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={handleAcknowledge}
                                            style={[styles.actionBtn, styles.actionPrimary]}
                                        >
                                            <IconSymbol
                                                color={W.bg}
                                                name="checkmark.circle.fill"
                                                size={14}
                                            />
                                            <Text style={styles.actionPrimaryText}>
                                                {action.label ?? 'Acknowledge'}
                                                {ackCount > 0 ? ` (${ackCount})` : ''}
                                            </Text>
                                        </Pressable>
                                    );
                                }

                                if (action.type === 'view') {
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={() => action.url && handleView(action.url)}
                                            style={styles.actionBtn}
                                        >
                                            <IconSymbol color={W.fg} name="globe" size={14} />
                                            <Text style={styles.actionText}>
                                                {action.label ?? 'View'}
                                            </Text>
                                        </Pressable>
                                    );
                                }

                                return null;
                            })}
                        </View>
                    ) : null}
                </View>

                <SectionHead>payload</SectionHead>

                <View style={styles.codeWrap}>
                    <WCode language="JSON">
                        {JSON.stringify(
                            {
                                acknowledgmentCount: message.acknowledgmentCount,
                                actions: message.actions,
                                body: message.body,
                                createdAt: new Date(message.createdAt).toISOString(),
                                priority: message.priority,
                                tags: message.tags,
                                title: message.title,
                                topic: topic.name,
                            },
                            null,
                            2,
                        )}
                    </WCode>
                </View>

                <SectionHead>reproduce · curl</SectionHead>
                <View style={styles.codeWrap}>
                    <WCode language="BASH">
                        {`curl -X POST ${api.baseUrl}/topic/${topic.name} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
      actions: message.actions.length ? message.actions : undefined,
      body: message.body,
      priority: message.priority,
      tags: message.tags,
      title: message.title,
  })}'`}
                    </WCode>
                </View>

                <SectionHead>delivery</SectionHead>
                {[
                    { e: 'received', ok: true, t: formatTime(message.createdAt) },
                    { e: `routed → ${topic.name}`, ok: true, t: formatTime(message.createdAt) },
                    { e: 'push → fcm', ok: true, t: formatTime(message.createdAt + 1000) },
                    {
                        e: 'delivered · this device',
                        ok: true,
                        t: formatTime(message.createdAt + 2000),
                    },
                ].map((s, i) => (
                    <View key={i} style={styles.timelineRow}>
                        <Text style={styles.timelineTime}>{s.t}</Text>
                        <Text style={[styles.timelineDot, { color: s.ok ? W.green : W.red }]}>
                            {s.ok ? '✓' : '✗'}
                        </Text>
                        <Text style={styles.timelineText}>{s.e}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pad(n: number) {
    return n.toString().padStart(2, '0');
}
function SectionHead({ children }: { children: string }) {
    return <Text style={styles.sectionHead}>{children}</Text>;
}

const styles = StyleSheet.create({
    actionBtn: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    actionPrimary: { backgroundColor: W.violet, borderColor: W.violet },
    actionPrimaryText: { color: W.bg, fontSize: 12.5, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
    actionText: {
        color: W.fg,
        fontSize: 12.5,
        fontWeight: '600',
    },
    backBtn: {
        alignItems: 'center',
        backgroundColor: W.bgElev,
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    body: {
        color: W.fgMuted,
        fontSize: 14,
        lineHeight: 22,
        marginTop: 10,
    },
    channelLabel: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        marginLeft: 'auto',
    },
    codeWrap: { paddingHorizontal: 20 },
    hero: {
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 18,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    loading: {
        color: W.fgMuted,
        flex: 1,
        fontFamily: Fonts.mono,
        paddingTop: 40,
        textAlign: 'center',
    },
    priorityText: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    prioRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    root: { backgroundColor: W.bg, flex: 1 },
    sectionHead: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 18,
        paddingHorizontal: 20,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 14,
    },
    timelineDot: { fontFamily: Fonts.mono, fontSize: 11, width: 12 },
    timelineRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    timelineText: {
        color: W.fgMuted,
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 11,
    },
    timelineTime: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        width: 64,
    },
    title: {
        color: W.fg,
        fontSize: 22,
        fontWeight: '600',
        letterSpacing: -0.6,
        lineHeight: 28,
        marginTop: 12,
    },
    topBar: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
});
