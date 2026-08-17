import { PRIORITY_LABEL } from '@emitsignal/shared';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Message, Subscription } from '@/lib/api';

import { WLogo } from '@/components/base-theme';
import { FeedComfy } from '@/components/feed/feed-comfy';
import { FeedPriority } from '@/components/feed/feed-priority';
import {
    type ComfyItem,
    dayLabel,
    type PriorityItem,
    type TimelineItem,
} from '@/components/feed/feed-shared';
import { FeedTimeline } from '@/components/feed/feed-timeline';
import { Fonts, type Palette } from '@/constants/theme';
import { useFeedStyle } from '@/ctx/feed-style';
import { useFeed } from '@/hooks/use-emit-signal';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { addReadId, getReadIds } from '@/storage/read-messages';

const FIXED_FILTERS = ['all', 'p4+', 'unread'] as const;

export default function FeedScreen() {
    const { palette, styles } = useThemedStyles(createStyles);
    const {
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        loading,
        messages,
        refresh,
        refreshing,
        subscriptions,
    } = useFeed();

    const { feedStyle } = useFeedStyle();
    const bottomInset = useTabBarInset();
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

    const feedProps = {
        bottomInset,
        error: error ?? undefined,
        filter,
        getTopicName,
        isFetchingNextPage,
        loading,
        onEndReached: hasNextPage ? () => fetchNextPage() : undefined,
        onPress: handlePress,
        refreshControl,
    };

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                </View>
                <Text style={styles.title}>Inbox</Text>
                <Text style={styles.subtitle}>
                    {messages.length}
                    {hasNextPage ? '+' : ''} message
                    {messages.length === 1 && !hasNextPage ? '' : 's'} · {subscriptions.length}{' '}
                    channel{subscriptions.length === 1 ? '' : 's'}
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

            {feedStyle === 'comfy' && <FeedComfy data={comfyData} {...feedProps} />}
            {feedStyle === 'priority' && <FeedPriority data={priorityData} {...feedProps} />}
            {feedStyle === 'timeline' && <FeedTimeline data={timelineData} {...feedProps} />}
        </SafeAreaView>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
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
        root: {
            backgroundColor: palette.bg,
            flex: 1,
        },
        subtitle: {
            color: palette.fgMuted,
            fontFamily: Fonts.mono,
            fontSize: 12,
            marginTop: 4,
        },
        title: {
            color: palette.fg,
            fontSize: 28,
            fontWeight: '600',
            letterSpacing: -0.5,
        },
    });
