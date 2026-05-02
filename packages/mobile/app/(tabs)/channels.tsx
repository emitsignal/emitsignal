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
import { ActivitySparkline, WDot, WLogo, WTopicAvatar } from "@/components/whinsper";
import { Fonts, PriorityColors, W } from "@/constants/theme";
import { useDevice } from "@/ctx/device";
import { api, type Subscription } from "@/lib/api";

export default function ChannelsScreen() {
    const { deviceId } = useDevice();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const refresh = async () => {
        if (!deviceId) {
            return;
        }

        setLoading(true);

        try {
            const subscriptions = await api.listSubscriptions(deviceId);

            setSubscriptions(subscriptions);
        } catch (error) {
            console.error(error);
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
        if (!deviceId) {
            return;
        }

        Alert.alert("Unsubscribe", `Stop receiving messages from ${sub.topic.name}?`, [
            { style: "cancel", text: "Cancel" },
            {
                onPress: async () => {
                    await api.unsubscribe(deviceId, sub.topic.name);
                    await refresh();
                },
                style: "destructive",
                text: "Unsubscribe",
            },
        ]);
    };

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
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
                    <IconSymbol color={W.fgDim} name="magnifyingglass" size={14} />
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setQuery}
                        placeholder="search topics…"
                        placeholderTextColor={W.fgDim}
                        style={styles.searchInput}
                        value={query}
                    />
                </View>
            </View>

            <FlatList
                contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
                data={filtered}
                keyExtractor={(s) => s.id}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>No channels yet</Text>
                            <Text style={styles.emptyBody}>
                                Tap the + button to subscribe to a topic.
                            </Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        colors={[W.violet]}
                        onRefresh={refresh}
                        refreshing={loading}
                        tintColor={W.violet}
                    />
                }
                renderItem={({ item }) => (
                    <ChannelRow
                        onLongPress={() => handleUnsubscribe(item)}
                        onPress={() => router.push(`/topics/${item.topic.name}`)}
                        sub={item}
                    />
                )}
            />

            <Pressable onPress={() => router.push("/modal")} style={styles.fab}>
                <IconSymbol color={W.bg} name="plus" size={14} />
                <Text style={styles.fabText}>+ subscribe</Text>
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
    // Stable activity-sparkline placeholder — once we have message-time
    // history this can be derived from real data.
    const seed = sub.topic.id.charCodeAt(sub.topic.id.length - 1);
    const data = Array.from({ length: 12 }, (_, i) => Math.abs(Math.sin((seed + i) * 0.7)) * 5);
    const prio = ((seed % 5) + 1 || 3) as 1 | 2 | 3 | 4 | 5;

    return (
        <Pressable onLongPress={onLongPress} onPress={onPress} style={styles.channelRow}>
            <WTopicAvatar name={sub.topic.name} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.channelHeader}>
                    <WDot level={prio} size={5} />
                    <Text style={styles.channelName}>{sub.topic.name}</Text>
                </View>
                {sub.topic.description ? (
                    <Text numberOfLines={1} style={styles.channelDesc}>
                        {sub.topic.description}
                    </Text>
                ) : null}
                <View style={{ marginTop: 6 }}>
                    <ActivitySparkline color={PriorityColors[prio]} data={data} height={14} />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    channelDesc: {
        color: W.fgMuted,
        fontSize: 11.5,
        marginTop: 4,
    },
    channelHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
    },
    channelName: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 13,
        fontWeight: "500",
    },
    channelRow: {
        alignItems: "center",
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    empty: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 40,
    },
    emptyBody: {
        color: W.fgMuted,
        fontSize: 13,
        marginTop: 8,
        textAlign: "center",
    },
    emptyTitle: { color: W.fg, fontSize: 16, fontWeight: "600" },
    fab: {
        alignItems: "center",
        backgroundColor: W.violet,
        borderRadius: 100,
        bottom: 24,
        elevation: 8,
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        position: "absolute",
        right: 20,
        shadowColor: W.violet,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    fabText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 13,
        fontWeight: "600",
    },
    header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
    headerTop: {
        alignItems: "center",
        flexDirection: "row",
        marginBottom: 16,
    },
    live: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        marginLeft: "auto",
    },
    root: { backgroundColor: W.bg, flex: 1 },
    searchBar: {
        alignItems: "center",
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        color: W.fg,
        flex: 1,
        fontFamily: Fonts.mono,
        fontSize: 12,
        padding: 0,
    },
    searchWrap: { paddingBottom: 14, paddingHorizontal: 20 },
    subtitle: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 12,
        marginTop: 4,
    },
    title: {
        color: W.fg,
        fontSize: 28,
        fontWeight: "600",
        letterSpacing: -0.5,
    },
});
