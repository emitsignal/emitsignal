import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Message, Subscription } from '@/lib/api';

import { WChip, WDot, WLogo, WTopicAvatar } from '@/components/base-theme';
import { Fonts, PriorityColors, W } from '@/constants/theme';
import { useFeed } from '@/hooks/use-emit-signal';

const FILTERS = ['all', 'p4+', 'unread', 'deploy', 'alerts', 'ci'] as const;
type Filter = (typeof FILTERS)[number];

export default function FeedScreen() {
    const { error, loading, messages, refresh, subscriptions } = useFeed();
    const [filter, setFilter] = useState<Filter>('all');

    const subscriptionMap = useMemo(() => {
        const m = new Map<string, Subscription>();
        for (const s of subscriptions) m.set(s.topic.id, s);
        return m;
    }, [subscriptions]);

    const filtered = useMemo(() => {
        if (filter === 'all') {
            return messages;
        }
        if (filter === 'p4+') {
            return messages.filter((message) => message.priority >= 4);
        }
        return messages.filter((message) => {
            const subscription = subscriptionMap.get(message.topicId);
            return subscription?.topic.name.includes(filter);
        });
    }, [filter, messages, subscriptionMap]);

    const now = filtered.slice(0, 2);
    const earlier = filtered.slice(2);

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                    <Text style={styles.live}>● live</Text>
                </View>
                <Text style={styles.title}>Inbox</Text>
                <Text style={styles.subtitle}>
                    {messages.length} message{messages.length === 1 ? '' : 's'} ·{' '}
                    {subscriptions.length} channel
                    {subscriptions.length === 1 ? '' : 's'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.filterRow}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
            >
                {FILTERS.map((filterItem) => (
                    <Pressable
                        key={filterItem}
                        onPress={() => setFilter(filterItem)}
                        style={[
                            styles.filterPill,
                            filterItem === filter && styles.filterPillActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filterItem === filter && styles.filterTextActive,
                            ]}
                        >
                            {filterItem}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <FlatList
                contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
                data={[
                    ...(now.length ? [{ kind: 'label' as const, text: 'NOW' }] : []),
                    ...now.map((message) => ({ kind: 'row' as const, message: message })),
                    ...(earlier.length ? [{ kind: 'label' as const, text: 'EARLIER' }] : []),
                    ...earlier.map((message) => ({ kind: 'row' as const, message: message })),
                ]}
                keyExtractor={(item, i) =>
                    item.kind === 'label' ? `${item.text}-${i}` : item.message.id
                }
                ListEmptyComponent={!loading ? <EmptyFeed message={error?.message} /> : null}
                refreshControl={
                    <RefreshControl
                        colors={[W.violet]}
                        onRefresh={refresh}
                        refreshing={loading}
                        tintColor={W.violet}
                    />
                }
                renderItem={({ item }) =>
                    item.kind === 'label' ? (
                        <SectionLabel>{item.text}</SectionLabel>
                    ) : (
                        <NotifRow
                            message={item.message}
                            onPress={() => router.push(`/messages/${item.message.id}`)}
                            topicName={
                                subscriptionMap.get(item.message.topicId)?.topic.name ?? 'unknown'
                            }
                        />
                    )
                }
            />
        </SafeAreaView>
    );
}

function EmptyFeed({ message }: { message?: string }) {
    return (
        <View style={styles.empty}>
            <WDot level={2} size={10} />
            <Text style={styles.emptyTitle}>
                {message ? 'Could not load feed' : 'No messages yet'}
            </Text>
            <Text style={styles.emptyBody}>
                {message ?? 'Subscribe to a channel to start receiving notifications.'}
            </Text>
        </View>
    );
}

function NotifRow({
    message,
    onPress,
    topicName,
}: {
    message: Message;
    onPress: () => void;
    topicName: string;
}) {
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <View
                style={[
                    styles.priorityRibbon,
                    {
                        backgroundColor: PriorityColors[message.priority],
                        opacity: message.priority >= 4 ? 1 : 0.4,
                    },
                ]}
            />
            <WTopicAvatar name={topicName} size={34} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.rowMeta}>
                    <Text style={styles.rowChannel}>{topicName}</Text>
                    <Text style={styles.rowTime}>{relativeTime(message.createdAt)}</Text>
                </View>
                <Text style={styles.rowTitle}>{message.title}</Text>
                <Text numberOfLines={2} style={styles.rowBody}>
                    {message.body}
                </Text>
                {message.tags.length > 0 ? (
                    <View style={styles.tagRow}>
                        {message.tags.slice(0, 3).map((tag) => (
                            <WChip key={tag}>{tag}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) {
        return 'now';
    }
    if (min < 60) {
        return `${min}m`;
    }
    const hr = Math.floor(min / 60);
    if (hr < 24) {
        return `${hr}h`;
    }
    const day = Math.floor(hr / 24);
    return `${day}d`;
}

function SectionLabel({ children }: { children: string }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    empty: {
        alignItems: 'center',
        flex: 1,
        gap: 10,
        justifyContent: 'center',
        padding: 40,
    },
    emptyBody: {
        color: W.fgMuted,
        fontSize: 13,
        textAlign: 'center',
    },
    emptyTitle: {
        color: W.fg,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 6,
    },
    filterPill: {
        alignSelf: 'flex-start',
        borderColor: W.bgLine,
        borderRadius: 100,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 11,
        paddingVertical: 5,
    },
    filterPillActive: {
        backgroundColor: W.violetBg,
        borderColor: `${W.violetDim}55`,
    },
    filterRow: {
        alignItems: 'center',
        gap: 6,
        paddingBottom: 14,
        paddingHorizontal: 20,
    },
    filterScroll: {
        flexGrow: 0,
        flexShrink: 0,
    },
    filterText: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 11,
    },
    filterTextActive: {
        color: W.violet,
    },
    header: {
        paddingBottom: 16,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    headerTop: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 16,
    },
    live: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        marginLeft: 'auto',
    },
    priorityRibbon: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        top: 0,
        width: 2,
    },
    root: {
        backgroundColor: W.bg,
        flex: 1,
    },
    row: {
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        position: 'relative',
    },
    rowBody: {
        color: W.fgMuted,
        fontSize: 12.5,
        lineHeight: 18,
        marginBottom: 6,
    },
    rowChannel: {
        color: W.fgDim,
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
    },
    rowMeta: {
        alignItems: 'baseline',
        flexDirection: 'row',
        marginBottom: 2,
    },
    rowTime: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
    },
    rowTitle: {
        color: W.fg,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionLabelLine: {
        backgroundColor: W.bgLine,
        flex: 1,
        height: 1,
        marginLeft: 10,
    },
    sectionLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    sectionLabelText: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 1.5,
    },
    subtitle: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 12,
        marginTop: 4,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    title: {
        color: W.fg,
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
});
