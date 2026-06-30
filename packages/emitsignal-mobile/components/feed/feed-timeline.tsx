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

import { WChip } from '@/components/base-theme';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

import { EmptyFeed, type TimelineItem } from './feed-shared';

interface FeedTimelineProps {
    bottomInset: number;
    data: TimelineItem[];
    error?: Error;
    filter: string;
    getTopicName: (message: Message) => string;
    isFetchingNextPage?: boolean;
    loading: boolean;
    onEndReached?: () => void;
    onPress: (message: Message) => void;
    refreshControl: React.ReactElement<RefreshControlProps>;
}

export function FeedTimeline({
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
}: FeedTimelineProps) {
    const emptyStyle = data.length === 0 ? { flex: 1 } : { paddingBottom: bottomInset };

    return (
        <FlatList
            contentContainerStyle={emptyStyle}
            data={data}
            keyExtractor={(item, index) =>
                item.kind === 'date' ? `date-${item.text}-${index}` : item.message.id
            }
            ListEmptyComponent={
                <EmptyFeed filter={filter} loading={loading} message={error?.message} />
            }
            ListFooterComponent={
                isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={refreshControl}
            renderItem={({ item }) =>
                item.kind === 'date' ? (
                    <TimelineDateLabel>{item.text}</TimelineDateLabel>
                ) : (
                    <TimelineRow
                        isLast={item.isLast}
                        message={item.message}
                        onPress={() => onPress(item.message)}
                        topicName={getTopicName(item.message)}
                    />
                )
            }
        />
    );
}

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

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        tagRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
        },
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
