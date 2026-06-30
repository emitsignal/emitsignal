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

import { WChip, WTopicAvatar } from '@/components/base-theme';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

import { type ComfyItem, EmptyFeed } from './feed-shared';

interface FeedComfyProps {
    bottomInset: number;
    data: ComfyItem[];
    error?: Error;
    filter: string;
    getTopicName: (message: Message) => string;
    isFetchingNextPage?: boolean;
    loading: boolean;
    onEndReached?: () => void;
    onPress: (message: Message) => void;
    refreshControl: React.ReactElement<RefreshControlProps>;
}

export function FeedComfy({
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
}: FeedComfyProps) {
    const emptyStyle = data.length === 0 ? { flex: 1 } : { paddingBottom: bottomInset };

    return (
        <FlatList
            contentContainerStyle={emptyStyle}
            data={data}
            keyExtractor={(item, index) =>
                item.kind === 'label' ? `label-${item.text}-${index}` : item.message.id
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
                item.kind === 'label' ? (
                    <SectionLabel>{item.text}</SectionLabel>
                ) : (
                    <NotifyRow
                        message={item.message}
                        onPress={() => onPress(item.message)}
                        topicName={getTopicName(item.message)}
                    />
                )
            }
        />
    );
}

function NotifyRow({
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

function SectionLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        priorityRibbon: {
            bottom: 0,
            left: 0,
            position: 'absolute',
            top: 0,
            width: 2,
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
        tagRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
        },
    });
