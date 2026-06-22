import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WChip } from '@/components/base-theme';
import { ScreenHeader } from '@/components/screen-header';
import { TopicActionsMenu } from '@/components/topic-actions-menu';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useTopicMessages } from '@/hooks/use-emit-signal';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { type Message } from '@/lib/api';

export default function TopicScreen() {
    const { styles } = useThemedStyles(createStyles);
    const params = useLocalSearchParams<{ topic: string | string[] }>();
    const topic = Array.isArray(params.topic) ? params.topic.join('/') : (params.topic ?? '');

    const { loading, messages } = useTopicMessages(topic);

    if (!topic) {
        return null;
    }

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <ScreenHeader
                right={<TopicActionsMenu topicName={topic} />}
                subtitle={`${messages.length} message${messages.length === 1 ? '' : 's'}`}
                title={topic}
            />

            <FlatList
                contentContainerStyle={messages.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
                data={messages}
                keyExtractor={(m) => m.id}
                ListEmptyComponent={
                    loading ? null : (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptyBody}>
                                Waiting for messages on <Text style={styles.mono}>{topic}</Text>…
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <MessageRow
                        message={item}
                        onPress={() => router.push(`/messages/${encodeURIComponent(item.id)}`)}
                    />
                )}
            />
        </SafeAreaView>
    );
}

function MessageRow({ message, onPress }: { message: Message; onPress: () => void }) {
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

            <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={styles.metaRow}>
                    <Text style={styles.timeText}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                    </Text>
                </View>

                <Text style={styles.title}>{message.title}</Text>
                <Text numberOfLines={3} style={styles.body}>
                    {message.body}
                </Text>

                {message.tags.length > 0 && (
                    <View style={styles.tags}>
                        {message.tags.slice(0, 4).map((tag, index) => (
                            <WChip key={index}>{tag}</WChip>
                        ))}
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        body: {
            color: palette.fgMuted,
            fontSize: 12.5,
            lineHeight: 18,
            marginTop: 4,
        },
        empty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 40 },
        emptyBody: {
            color: palette.fgMuted,
            fontSize: 13,
            marginTop: 8,
            textAlign: 'center',
        },
        emptyExample: { marginTop: 20, width: '100%' },
        emptyTitle: { color: palette.fg, fontSize: 16, fontWeight: '600' },
        metaRow: { flexDirection: 'row', marginBottom: 4 },
        mono: { fontFamily: Fonts.mono },
        priorityRibbon: {
            bottom: 0,
            left: 0,
            position: 'absolute',
            top: 0,
            width: 2,
        },
        root: { backgroundColor: palette.bg, flex: 1 },
        row: {
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 14,
            position: 'relative',
        },
        tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
        timeText: { color: palette.fgDim, fontFamily: Fonts.mono, fontSize: 10.5 },
        title: { color: palette.fg, fontSize: 14, fontWeight: '600' },
    });
