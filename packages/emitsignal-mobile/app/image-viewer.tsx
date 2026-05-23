import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    ActivityIndicator,
    Linking,
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

export default function ImageViewerScreen() {
    const insets = useSafeAreaInsets();
    const [downloading, setDownloading] = useState(false);
    const { filename, size, url } = useLocalSearchParams<{
        filename: string;
        size: string;
        url: string;
    }>();
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();

    if (!url) {
        return null;
    }

    const handleDownload = async () => {
        if (downloading) {
            return;
        }

        setDownloading(true);

        try {
            const available = await Sharing.isAvailableAsync();

            if (!available) {
                await Linking.openURL(url);

                return;
            }

            const localUri = `${FileSystem.cacheDirectory}${filename ?? 'image'}`;
            const result = await FileSystem.downloadAsync(url, localUri);

            await Sharing.shareAsync(result.uri, {
                dialogTitle: filename,
                mimeType: 'image/*',
            });
        } catch (error) {
            console.warn('Download failed:', error);
        }

        setDownloading(false);
    };

    return (
        <View style={[styles.root, { paddingBottom: insets.bottom }]}>
            <View style={[styles.closeOverlay, { top: insets.top }]}>
                <Pressable hitSlop={12} onPress={() => router.back()} style={styles.closeBtn}>
                    <IconSymbol color={W.fg} name="xmark" size={22} />
                </Pressable>
            </View>

            <ScrollView
                bouncesZoom={false}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={5}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                <Image
                    contentFit="contain"
                    source={{ uri: url }}
                    style={{
                        height: (screenHeight - insets.top - insets.bottom) * 0.75,
                        width: screenWidth,
                    }}
                    transition={300}
                />
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    {filename ? (
                        <Text numberOfLines={1} style={styles.filename}>
                            {filename}
                        </Text>
                    ) : null}
                    {size ? (
                        <Text style={styles.size}>{formatSize(parseInt(size, 10))}</Text>
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

const styles = StyleSheet.create({
    closeBtn: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    closeOverlay: {
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 8,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 10,
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
    root: {
        backgroundColor: 'rgba(0,0,0,0.88)',
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    size: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 11,
        marginTop: 4,
    },
});
