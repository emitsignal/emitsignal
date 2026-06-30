import { relativeTime } from '@emitsignal/shared';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    type RefreshControlProps,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { Message } from '@/lib/api';

import { WChip, WDot, WTopicAvatar } from '@/components/base-theme';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

import { EmptyFeed, type PriorityItem } from './feed-shared';

interface FeedPriorityProps {
    bottomInset: number;
    data: PriorityItem[];
    error?: Error;
    filter: string;
    getTopicName: (message: Message) => string;
    isFetchingNextPage?: boolean;
    loading: boolean;
    onEndReached?: () => void;
    onPress: (message: Message) => void;
    refreshControl: React.ReactElement<RefreshControlProps>;
}

export function FeedPriority({
    bottomInset,
    data,
    error,
    filter,
    getTopicName,
    isFetchingNextPage,
    loading,
    onEndReached,
    onPress,
    refreshControl,
}: FeedPriorityProps) {
    const emptyStyle = data.length === 0 ? { flex: 1 } : { paddingBottom: bottomInset };
    const emptyComponent = <EmptyFeed filter={filter} loading={loading} message={error?.message} />;

    return (
        <FlatList
            contentContainerStyle={emptyStyle}
            data={data}
            keyExtractor={(item, index) =>
                item.kind === 'priority-header' ? `ph-${item.level}-${index}` : item.message.id
            }
            ListEmptyComponent={emptyComponent}
            ListFooterComponent={
                isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={refreshControl}
            renderItem={({ item }) =>
                item.kind === 'priority-header' ? (
                    <PriorityHeader label={item.label} level={item.level} />
                ) : (
                    <PriorityRow
                        message={item.message}
                        onPress={() => onPress(item.message)}
                        topicName={getTopicName(item.message)}
                    />
                )
            }
        />
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

const createStyles = (palette: Palette) =>
    StyleSheet.create({
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
        prRow: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 11,
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
        tagRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
        },
    });
