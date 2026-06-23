import { PRIORITY_LABEL, relativeTime } from '@emitsignal/shared';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useFeedStyle } from '@/ctx/feed-style';
import { useFeed } from '@/hooks/use-emit-signal';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { addReadId, getReadIds } from '@/storage/read-messages';

const FIXED_FILTERS = ['all', 'p4+', 'unread'] as const;

// ─── data shapes per view ────────────────────────────────────────────────────

type ComfyItem = { kind: 'label'; text: string } | { kind: 'row'; message: Message };

type PriorityItem =
    | { kind: 'priority-header'; label: string; level: 1 | 2 | 3 | 4 | 5 }
    | { kind: 'row'; message: Message };

type TimelineItem =
    | { isLast: boolean; kind: 'row'; message: Message }
    | { kind: 'date'; text: string };

// ─── screen ──────────────────────────────────────────────────────────────────

export default function FeedScreen() {
    const { palette, styles } = useThemedStyles(createStyles);
    const { error, loading, messages, refresh, refreshing, subscriptions } = useFeed();
    const { feedStyle } = useFeedStyle();
    const [filter, setFilter] = useState<string>('all');
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        getReadIds().then(setReadIds);
    }, []);

    const subscriptionMap = useMemo(() => {
        const map = new Map<string, Subscription>();

        for (const subscription of subscriptions) {
            map.set(subscription.topic.id, subscription);
        }
        return map;
    }, [subscriptions]);

    const tagFilters = useMemo(() => {
        const tags = new Set<string>();

        for (const message of messages) {
            for (const tag of message.tags) {
                tags.add(tag);
            }
        }
        return [...tags].sort();
    }, [messages]);

    const allFilters = useMemo(() => [...FIXED_FILTERS, ...tagFilters], [tagFilters]);

    const filtered = useMemo(() => {
        if (filter === 'all') {
            return messages;
        }
        if (filter === 'p4+') {
            return messages.filter((m) => m.priority >= 4);
        }
        if (filter === 'unread') {
            return messages.filter((m) => !readIds.has(m.id));
        }
        return messages.filter((m) => m.tags.includes(filter));
    }, [filter, messages, readIds]);

    const handlePress = (message: Message) => {
        setReadIds((prev) => new Set(prev).add(message.id));
        addReadId(message.id);
        router.push(`/messages/${message.id}`);
    };

    const getTopicName = (message: Message) =>
        subscriptionMap.get(message.topicId)?.topic.name ?? 'unknown';

    // Comfy: NOW (first 2) / EARLIER sections
    const comfyData = useMemo<ComfyItem[]>(() => {
        const now = filtered.slice(0, 2);
        const earlier = filtered.slice(2);
        return [
            ...(now.length ? [{ kind: 'label' as const, text: 'NOW' }] : []),
            ...now.map((message) => ({ kind: 'row' as const, message })),
            ...(earlier.length ? [{ kind: 'label' as const, text: 'EARLIER' }] : []),
            ...earlier.map((message) => ({ kind: 'row' as const, message })),
        ];
    }, [filtered]);

    // Timeline: grouped by calendar day
    const timelineData = useMemo<TimelineItem[]>(() => {
        const items: TimelineItem[] = [];
        let currentDay = '';
        for (let i = 0; i < filtered.length; i++) {
            const message = filtered[i];
            const day = dayLabel(message.createdAt);
            if (day !== currentDay) {
                currentDay = day;
                items.push({ kind: 'date', text: day });
            }
            const nextMsg = filtered[i + 1];
            const isLast = !nextMsg || dayLabel(nextMsg.createdAt) !== currentDay;
            items.push({ isLast, kind: 'row', message });
        }
        return items;
    }, [filtered]);

    // Priority-first: P5 → P1 groups, empty groups omitted
    const priorityData = useMemo<PriorityItem[]>(() => {
        const levels = [5, 4, 3, 2, 1] as const;
        return levels.flatMap((level) => {
            const group = filtered.filter((m) => m.priority === level);
            if (!group.length) {
                return [];
            }
            return [
                { kind: 'priority-header' as const, label: PRIORITY_LABEL[level], level },
                ...group.map((message) => ({ kind: 'row' as const, message })),
            ];
        });
    }, [filtered]);

    const refreshControl = (
        <RefreshControl
            colors={[palette.violet]}
            onRefresh={refresh}
            refreshing={refreshing}
            tintColor={palette.violet}
        />
    );

    const emptyComponent = loading ? (
        <View style={styles.empty}>
            <ActivityIndicator color={palette.violet} />
        </View>
    ) : (
        <EmptyFeed filter={filter} message={error?.message} />
    );

    const emptyStyle = filtered.length === 0 ? { flex: 1 } : { paddingBottom: 40 };

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
                    {subscriptions.length} channel{subscriptions.length === 1 ? '' : 's'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.filterRow}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
            >
                {allFilters.map((filterItem) => (
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

            {feedStyle === 'comfy' && (
                <FlatList
                    contentContainerStyle={emptyStyle}
                    data={comfyData}
                    keyExtractor={(item, i) =>
                        item.kind === 'label' ? `label-${item.text}-${i}` : item.message.id
                    }
                    ListEmptyComponent={emptyComponent}
                    refreshControl={refreshControl}
                    renderItem={({ item }) =>
                        item.kind === 'label' ? (
                            <SectionLabel>{item.text}</SectionLabel>
                        ) : (
                            <NotifRow
                                message={item.message}
                                onPress={() => handlePress(item.message)}
                                topicName={getTopicName(item.message)}
                            />
                        )
                    }
                />
            )}

            {feedStyle === 'timeline' && (
                <FlatList
                    contentContainerStyle={emptyStyle}
                    data={timelineData}
                    keyExtractor={(item, i) =>
                        item.kind === 'date' ? `date-${item.text}-${i}` : item.message.id
                    }
                    ListEmptyComponent={emptyComponent}
                    refreshControl={refreshControl}
                    renderItem={({ item }) =>
                        item.kind === 'date' ? (
                            <TimelineDateLabel>{item.text}</TimelineDateLabel>
                        ) : (
                            <TimelineRow
                                isLast={item.isLast}
                                message={item.message}
                                onPress={() => handlePress(item.message)}
                                topicName={getTopicName(item.message)}
                            />
                        )
                    }
                />
            )}

            {feedStyle === 'priority' && (
                <FlatList
                    contentContainerStyle={emptyStyle}
                    data={priorityData}
                    keyExtractor={(item, i) =>
                        item.kind === 'priority-header' ? `ph-${item.level}-${i}` : item.message.id
                    }
                    ListEmptyComponent={emptyComponent}
                    refreshControl={refreshControl}
                    renderItem={({ item }) =>
                        item.kind === 'priority-header' ? (
                            <PriorityHeader label={item.label} level={item.level} />
                        ) : (
                            <PriorityRow
                                message={item.message}
                                onPress={() => handlePress(item.message)}
                                topicName={getTopicName(item.message)}
                            />
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
}

// ─── shared utilities ─────────────────────────────────────────────────────────

function dayLabel(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    if (d >= todayStart) {
        return 'Today';
    }

    if (d >= yesterdayStart) {
        return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function EmptyFeed({ filter, message }: { filter: string; message?: string }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.empty}>
            <WDot level={2} size={10} />
            <Text style={styles.emptyTitle}>
                {message
                    ? 'Could not load feed'
                    : filter !== 'all'
                      ? `No ${filter} messages`
                      : 'No messages yet'}
            </Text>
            <Text style={styles.emptyBody}>
                {message
                    ? message
                    : filter !== 'all'
                      ? 'Try a different filter'
                      : 'Subscribe to a channel to start receiving notifications.'}
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
    const { styles } = useThemedStyles(createStyles);
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
                        {message.tags.slice(0, 3).map((tag, index) => (
                            <WChip key={index}>{tag}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

function PriorityHeader({ label, level }: { label: string; level: 1 | 2 | 3 | 4 | 5 }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.phRow}>
            <WDot level={level} size={6} />
            <Text style={[styles.phLevel, { color: PriorityColors[level] }]}>P{level}</Text>
            <Text style={styles.phLabel}>{label}</Text>
            <View style={styles.phLine} />
        </View>
    );
}

// ─── A: Comfy (default) ──────────────────────────────────────────────────────

function PriorityRow({
    message,
    onPress,
    topicName,
}: {
    message: Message;
    onPress: () => void;
    topicName: string;
}) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <Pressable onPress={onPress} style={styles.prRow}>
            <WTopicAvatar name={topicName} size={32} />

            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.rowMeta}>
                    <Text style={styles.rowChannel}>{topicName}</Text>
                    <Text style={styles.rowTime}>{relativeTime(message.createdAt)}</Text>
                </View>

                <Text style={styles.rowTitle}>{message.title}</Text>

                {message.body ? (
                    <Text numberOfLines={1} style={styles.rowBody}>
                        {message.body}
                    </Text>
                ) : null}

                {message.tags.length > 0 ? (
                    <View style={styles.tagRow}>
                        {message.tags.slice(0, 2).map((tag, index) => (
                            <WChip key={index}>{tag}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

// ─── C: Timeline ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

// ─── D: Priority-first ───────────────────────────────────────────────────────

function TimelineDateLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.tlDateRow}>
            <View style={styles.tlTrack}>
                <View style={styles.tlLine} />
            </View>
            <View style={styles.tlDateBadge}>
                <Text style={styles.tlDateText}>{children}</Text>
            </View>
        </View>
    );
}

function TimelineRow({
    isLast,
    message,
    onPress,
    topicName,
}: {
    isLast: boolean;
    message: Message;
    onPress: () => void;
    topicName: string;
}) {
    const { styles } = useThemedStyles(createStyles);
    const priorityColor = PriorityColors[message.priority];
    return (
        <Pressable onPress={onPress} style={styles.tlRow}>
            <View style={styles.tlTrack}>
                <View style={[styles.tlLine, isLast && styles.tlLineHalf]} />
                <View style={[styles.tlDot, { backgroundColor: priorityColor }]} />
            </View>

            <View style={styles.tlContent}>
                <View style={styles.tlMeta}>
                    <Text style={styles.tlTopic}>{topicName}</Text>
                    <Text style={styles.tlTime}>{relativeTime(message.createdAt)}</Text>
                </View>

                <Text style={styles.tlTitle}>{message.title}</Text>

                {message.body ? (
                    <Text numberOfLines={2} style={styles.tlBody}>
                        {message.body}
                    </Text>
                ) : null}

                {message.tags.length > 0 ? (
                    <View style={[styles.tagRow, { marginBottom: 2 }]}>
                        {message.tags.slice(0, 3).map((tag, index) => (
                            <WChip key={index}>{tag}</WChip>
                        ))}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        empty: {
            alignItems: 'center',
            flex: 1,
            gap: 10,
            justifyContent: 'center',
            padding: 40,
        },
        emptyBody: {
            color: palette.fgMuted,
            fontSize: 13,
            textAlign: 'center',
        },
        emptyTitle: {
            color: palette.fg,
            fontSize: 16,
            fontWeight: '600',
            marginTop: 6,
        },
        filterPill: {
            alignSelf: 'flex-start',
            borderColor: palette.bgLine,
            borderRadius: 100,
            borderWidth: StyleSheet.hairlineWidth,
            paddingHorizontal: 11,
            paddingVertical: 5,
        },
        filterPillActive: {
            backgroundColor: palette.violetBg,
            borderColor: `${palette.violetDim}55`,
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
            color: palette.fgMuted,
            fontFamily: Fonts.mono,
            fontSize: 11,
        },
        filterTextActive: {
            color: palette.violet,
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
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
            marginLeft: 'auto',
        },

        // ── priority-first header ──
        phLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 1.5,
        },
        phLevel: {
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        phLine: {
            backgroundColor: palette.bgLine,
            flex: 1,
            height: 1,
            marginLeft: 4,
        },
        phRow: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 6,
            paddingBottom: 6,
            paddingHorizontal: 20,
            paddingTop: 18,
        },

        // ── comfy row ──
        priorityRibbon: {
            bottom: 0,
            left: 0,
            position: 'absolute',
            top: 0,
            width: 2,
        },

        // ── priority row ──
        prRow: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 11,
        },
        root: {
            backgroundColor: palette.bg,
            flex: 1,
        },
        row: {
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 14,
            position: 'relative',
        },
        rowBody: {
            color: palette.fgMuted,
            fontSize: 12.5,
            lineHeight: 18,
            marginBottom: 6,
        },
        rowChannel: {
            color: palette.fgDim,
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
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
        },
        rowTitle: {
            color: palette.fg,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
        },
        sectionLabelLine: {
            backgroundColor: palette.bgLine,
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
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 1.5,
        },
        subtitle: {
            color: palette.fgMuted,
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
            color: palette.fg,
            fontSize: 28,
            fontWeight: '600',
            letterSpacing: -0.5,
        },
        // ── timeline ──
        tlBody: {
            color: palette.fgMuted,
            fontSize: 12,
            lineHeight: 17,
            marginBottom: 8,
        },
        tlContent: {
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flex: 1,
            paddingBottom: 14,
            paddingRight: 20,
            paddingTop: 12,
        },
        tlDateBadge: {
            backgroundColor: palette.bgChip,
            borderColor: palette.bgLine,
            borderRadius: 4,
            borderWidth: StyleSheet.hairlineWidth,
            paddingHorizontal: 8,
            paddingVertical: 3,
        },
        tlDateRow: {
            alignItems: 'center',
            flexDirection: 'row',
            paddingVertical: 10,
        },
        tlDateText: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 0.8,
        },
        tlDot: {
            borderRadius: 4,
            height: 8,
            marginTop: 16,
            width: 8,
            zIndex: 1,
        },
        tlLine: {
            backgroundColor: palette.bgLine,
            bottom: 0,
            left: '50%',
            position: 'absolute',
            top: 0,
            width: 1,
        },
        tlLineHalf: {
            bottom: '50%',
        },
        tlMeta: {
            alignItems: 'baseline',
            flexDirection: 'row',
            marginBottom: 3,
        },
        tlRow: {
            flexDirection: 'row',
            paddingLeft: 20,
        },
        tlTime: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
        },
        tlTitle: {
            color: palette.fg,
            fontSize: 13.5,
            fontWeight: '600',
            marginBottom: 3,
        },
        tlTopic: {
            color: palette.fgDim,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
        },
        tlTrack: {
            alignItems: 'center',
            position: 'relative',
            width: 28,
        },
    });
