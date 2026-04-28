import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    ActivitySparkline,
    WDot,
    WLogo,
    WTopicAvatar,
} from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { useDevice } from "@/ctx/device";
import { api, type Subscription } from "@/lib/api";

export default function ChannelsScreen() {
    const { deviceId } = useDevice();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const refresh = async () => {
        if (!deviceId) return;
        setLoading(true);
        try {
            const subs = await api.listSubscriptions(deviceId);
            setSubscriptions(subs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (deviceId) refresh();
    }, [deviceId]);

    const filtered = useMemo(() => {
        if (!query.trim()) return subscriptions;
        const q = query.trim().toLowerCase();
        return subscriptions.filter(
            (s) =>
                s.topic.name.toLowerCase().includes(q) ||
                s.topic.displayName.toLowerCase().includes(q),
        );
    }, [subscriptions, query]);

    const handleUnsubscribe = (sub: Subscription) => {
        if (!deviceId) return;
        Alert.alert(
            "Unsubscribe",
            `Stop receiving messages from ${sub.topic.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unsubscribe",
                    style: "destructive",
                    onPress: async () => {
                        await api.unsubscribe(deviceId, sub.topic.name);
                        await refresh();
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo size={12} pulse />
                    <Text style={styles.live}>● live</Text>
                </View>
                <Text style={styles.title}>Channels</Text>
                <Text style={styles.subtitle}>
                    {subscriptions.length} subscribed
                </Text>
            </View>

            <View style={styles.searchWrap}>
                <View style={styles.searchBar}>
                    <IconSymbol name="magnifyingglass" size={14} color={W.fgDim} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="search topics…"
                        placeholderTextColor={W.fgDim}
                        style={styles.searchInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(s) => s.id}
                renderItem={({ item }) => (
                    <ChannelRow
                        sub={item}
                        onPress={() => router.push(`/topics/${item.topic.name}`)}
                        onLongPress={() => handleUnsubscribe(item)}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>
                                No channels yet
                            </Text>
                            <Text style={styles.emptyBody}>
                                Tap the + button to subscribe to a topic.
                            </Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refresh}
                        tintColor={W.violet}
                        colors={[W.violet]}
                    />
                }
                contentContainerStyle={
                    filtered.length === 0 ? { flex: 1 } : { paddingBottom: 100 }
                }
            />

            <Pressable
                onPress={() => router.push("/modal")}
                style={styles.fab}
            >
                <IconSymbol name="plus" size={14} color={W.bg} />
                <Text style={styles.fabText}>+ subscribe</Text>
            </Pressable>
        </SafeAreaView>
    );
}

function ChannelRow({
    sub,
    onPress,
    onLongPress,
}: {
    sub: Subscription;
    onPress: () => void;
    onLongPress: () => void;
}) {
    // Stable activity-sparkline placeholder — once we have message-time
    // history this can be derived from real data.
    const seed = sub.topic.id.charCodeAt(sub.topic.id.length - 1);
    const data = Array.from({ length: 12 }, (_, i) =>
        Math.abs(Math.sin((seed + i) * 0.7)) * 5,
    );
    const prio = (((seed % 5) + 1) || 3) as 1 | 2 | 3 | 4 | 5;

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.channelRow}
        >
            <WTopicAvatar name={sub.topic.name} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.channelHeader}>
                    <WDot level={prio} size={5} />
                    <Text style={styles.channelName}>{sub.topic.name}</Text>
                </View>
                {sub.topic.description ? (
                    <Text style={styles.channelDesc} numberOfLines={1}>
                        {sub.topic.description}
                    </Text>
                ) : null}
                <View style={{ marginTop: 6 }}>
                    <ActivitySparkline
                        data={data}
                        color={PriorityColors[prio]}
                        height={14}
                    />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: W.bg },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    live: {
        marginLeft: "auto",
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        color: W.fgDim,
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: W.fg,
        letterSpacing: -0.5,
    },
    subtitle: {
        marginTop: 4,
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fgMuted,
    },
    searchWrap: { paddingHorizontal: 20, paddingBottom: 14 },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: W.bgElev,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fg,
        padding: 0,
    },
    channelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    channelHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    channelName: {
        fontFamily: Fonts.mono,
        fontSize: 13,
        color: W.fg,
        fontWeight: "500",
    },
    channelDesc: {
        fontSize: 11.5,
        color: W.fgMuted,
        marginTop: 4,
    },
    empty: {
        flex: 1,
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: W.fg },
    emptyBody: {
        marginTop: 8,
        fontSize: 13,
        color: W.fgMuted,
        textAlign: "center",
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: W.violet,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 100,
        shadowColor: W.violet,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    fabText: {
        fontFamily: Fonts.mono,
        fontSize: 13,
        fontWeight: "600",
        color: W.bg,
    },
});
