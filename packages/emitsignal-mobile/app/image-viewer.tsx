import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, W } from '@/constants/theme';
import { formatSize } from '@/lib/format';

interface GalleryItem {
    filename?: string;
    size?: string;
    url: string;
}

export default function ImageViewerScreen() {
    const insets = useSafeAreaInsets();
    const [downloading, setDownloading] = useState(false);
    const params = useLocalSearchParams<{
        filename?: string;
        gallery?: string;
        index?: string;
        size?: string;
        url?: string;
    }>();
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();

    const items = parseItems(params);
    const initialIndex = Math.min(
        Math.max(parseInt(params.index ?? '0', 10) || 0, 0),
        items.length - 1,
    );
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    if (items.length === 0) {
        return null;
    }

    const active = items[activeIndex] ?? items[0];

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);

        if (index !== activeIndex && index >= 0 && index < items.length) {
            setActiveIndex(index);
        }
    };

    const handleDownload = async () => {
        if (downloading) {
            return;
        }

        setDownloading(true);

        try {
            const available = await Sharing.isAvailableAsync();

            if (!available) {
                await Linking.openURL(active.url);

                return;
            }

            const localUri = `${FileSystem.cacheDirectory}${active.filename ?? 'image'}`;
            const result = await FileSystem.downloadAsync(active.url, localUri);

            await Sharing.shareAsync(result.uri, {
                dialogTitle: active.filename,
                mimeType: 'image/*',
            });
        } catch (error) {
            console.warn('Download failed:', error);
        }

        setDownloading(false);
    };

    return (
        <View style={[styles.root, { paddingBottom: insets.bottom }]}>
            <View style={[styles.topOverlay, { top: insets.top }]}>
                {items.length > 1 ? (
                    <Text style={styles.counter}>
                        {activeIndex + 1} / {items.length}
                    </Text>
                ) : (
                    <View />
                )}
                <Pressable hitSlop={12} onPress={() => router.back()} style={styles.closeBtn}>
                    <IconSymbol color={W.fg} name="xmark" size={22} />
                </Pressable>
            </View>

            <FlatList
                data={items}
                getItemLayout={(_, index) => ({
                    index,
                    length: screenWidth,
                    offset: screenWidth * index,
                })}
                horizontal
                initialScrollIndex={initialIndex}
                keyExtractor={(_, index) => String(index)}
                onScroll={handleScroll}
                pagingEnabled
                renderItem={({ item }) => (
                    <ScrollView
                        bouncesZoom={false}
                        centerContent
                        contentContainerStyle={styles.scrollContent}
                        maximumZoomScale={5}
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        style={{ width: screenWidth }}
                    >
                        <Image
                            contentFit="contain"
                            source={{ uri: item.url }}
                            style={{
                                height: (screenHeight - insets.top - insets.bottom) * 0.75,
                                width: screenWidth,
                            }}
                            transition={300}
                        />
                    </ScrollView>
                )}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                style={styles.list}
            />

            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    {active.filename ? (
                        <Text numberOfLines={1} style={styles.filename}>
                            {active.filename}
                        </Text>
                    ) : null}
                    {active.size ? (
                        <Text style={styles.size}>{formatSize(parseInt(active.size, 10))}</Text>
                    ) : null}
                </View>
                <Pressable
                    disabled={downloading}
                    hitSlop={8}
                    onPress={handleDownload}
                    style={styles.downloadBtn}
                >
                    {downloading ? (
                        <ActivityIndicator color={W.fg} size="small" />
                    ) : (
                        <IconSymbol color={W.fg} name="square.and.arrow.down" size={20} />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

function parseItems(params: {
    filename?: string;
    gallery?: string;
    size?: string;
    url?: string;
}): GalleryItem[] {
    if (params.gallery) {
        try {
            const parsed = JSON.parse(params.gallery) as GalleryItem[];

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch {
            // fall through to single-item handling
        }
    }

    if (params.url) {
        return [{ filename: params.filename, size: params.size, url: params.url }];
    }

    return [];
}

const styles = StyleSheet.create({
    closeBtn: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    counter: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 12,
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    downloadBtn: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    filename: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 12,
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 8,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    footerInfo: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    root: {
        backgroundColor: 'rgba(0,0,0,0.88)',
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'center',
    },
    size: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        marginTop: 4,
    },
    topOverlay: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        left: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        position: 'absolute',
        right: 0,
        zIndex: 10,
    },
});
