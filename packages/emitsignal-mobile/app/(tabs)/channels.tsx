import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitySparkline, WDot, WLogo, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { type Subscription } from '@/lib/api';

export default function ChannelsScreen() {
    const [query, setQuery] = useState('');
    const { loading, refresh, refreshing, subscriptions, unsubscribe } = useSubscriptions();
    const { palette, styles } = useThemedStyles(createStyles);
    const insets = useSafeAreaInsets();

    const filtered = useMemo(() => {
        if (!query.trim()) {
            return subscriptions;
        }

        const q = query.trim().toLowerCase();

        return subscriptions.filter(
            (subscription) =>
                subscription.topic.displayName.toLowerCase().includes(q) ||
                subscription.topic.name.toLowerCase().includes(q),
        );
    }, [subscriptions, query]);

    const handleUnsubscribe = (subscription: Subscription) => {
        Alert.alert('Unsubscribe', `Stop receiving messages from ${subscription.topic.name}?`, [
            { style: 'cancel', text: 'Cancel' },
            {
                onPress: () => {
                    void unsubscribe(subscription.topic.name);
                },
                style: 'destructive',
                text: 'Unsubscribe',
            },
        ]);
    };

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                    <Text style={styles.live}>● live</Text>
                </View>
                <Text style={styles.title}>Channels</Text>
                <Text style={styles.subtitle}>{subscriptions.length} subscribed</Text>
            </View>

            <View style={styles.searchWrap}>
                <View style={styles.searchBar}>
                    <IconSymbol color={palette.fgDim} name="magnifyingglass" size={14} />
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setQuery}
                        placeholder="search topics…"
                        placeholderTextColor={palette.fgDim}
                        style={styles.searchInput}
                        value={query}
                    />
                </View>
            </View>

            <FlatList
                contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
                data={filtered}
                keyExtractor={({ id }) => id}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <WDot level={2} size={10} />
                            <Text style={styles.emptyTitle}>
                                {query.trim()
                                    ? `No results for "${query.trim()}"`
                                    : 'No channels yet'}
                            </Text>
                            <Text style={styles.emptyBody}>
                                {query.trim()
                                    ? 'Try a different search term.'
                                    : 'Tap the + button to subscribe to a topic.'}
                            </Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        colors={[palette.violet]}
                        onRefresh={refresh}
                        refreshing={refreshing}
                        tintColor={palette.violet}
                    />
                }
                renderItem={({ item }) => (
                    <ChannelRow
                        onLongPress={() => handleUnsubscribe(item)}
                        onPress={() =>
                            router.push(`/topics/${encodeURIComponent(item.topic.name)}`)
                        }
                        sub={item}
                    />
                )}
            />

            <Pressable
                onPress={() => router.push('/modal')}
                style={[styles.fab, { bottom: insets.bottom + 24 }]}
            >
                <IconSymbol color={palette.bg} name="plus" size={14} />
                <Text style={styles.fabText}>Subscribe</Text>
            </Pressable>
        </SafeAreaView>
    );
}

function ChannelRow({
    onLongPress,
    onPress,
    sub,
}: {
    onLongPress: () => void;
    onPress: () => void;
    sub: Subscription;
}) {
    const { styles } = useThemedStyles(createStyles);
    // Stable activity-sparkline placeholder — once we have message-time
    // history this can be derived from real data.
    const seed = sub.topic.id.charCodeAt(sub.topic.id.length - 1);
    const data = Array.from({ length: 12 }, (_, i) => Math.abs(Math.sin((seed + i) * 0.7)) * 5);
    const priority = ((seed % 5) + 1 || 3) as 1 | 2 | 3 | 4 | 5;

    return (
        <Pressable onLongPress={onLongPress} onPress={onPress} style={styles.channelRow}>
            <WTopicAvatar name={sub.topic.name} size={36} />

            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.channelHeader}>
                    <WDot level={priority} size={5} />
                    <Text style={styles.channelName}>{sub.topic.name}</Text>
                </View>

                {sub.topic.description && (
                    <Text numberOfLines={1} style={styles.channelDesc}>
                        {sub.topic.description}
                    </Text>
                )}

                <View style={{ marginTop: 6 }}>
                    <ActivitySparkline color={PriorityColors[priority]} data={data} height={14} />
                </View>
            </View>
        </Pressable>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        channelDesc: {
            color: palette.fgMuted,
            fontSize: 11.5,
            marginTop: 4,
        },
        channelHeader: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 6,
        },
        channelName: {
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 13,
            fontWeight: '500',
        },
        channelRow: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 14,
        },
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
        fab: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 100,
            elevation: 8,
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 18,
            paddingVertical: 12,
            position: 'absolute',
            right: 20,
            shadowColor: palette.violet,
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
        },
        fabText: {
            color: palette.bg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
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
        root: { backgroundColor: palette.bg, flex: 1 },
        searchBar: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
        },
        searchInput: {
            color: palette.fg,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 12,
            padding: 0,
        },
        searchWrap: { paddingBottom: 14, paddingHorizontal: 20 },
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
