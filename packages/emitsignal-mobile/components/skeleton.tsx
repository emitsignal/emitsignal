import { useEffect } from 'react';
import { type DimensionValue, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

interface SkeletonProps {
    height?: number;
    radius?: number;
    style?: ViewStyle;
    width?: DimensionValue;
}

export function Skeleton({ height = 12, radius = 6, style, width = '100%' }: SkeletonProps) {
    const { styles } = useThemedStyles(createStyles);
    const reducedMotion = useReducedMotion();
    const pulse = useSharedValue(0.5);

    useEffect(() => {
        if (reducedMotion) {
            return;
        }

        pulse.value = withRepeat(
            withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
    }, [pulse, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

    return (
        <Animated.View
            style={[
                styles.block,
                { borderRadius: radius, height, width },
                style,
                reducedMotion ? { opacity: 0.5 } : animatedStyle,
            ]}
        />
    );
}

export function SkeletonMessageDetail() {
    const { styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.detail}>
            <Skeleton height={11} radius={4} width={128} />
            <Skeleton height={24} style={styles.detailTitle} width="82%" />
            <Skeleton height={13} style={styles.detailLine} width="97%" />
            <Skeleton height={13} style={styles.detailLine} width="90%" />
            <Skeleton height={13} style={styles.detailLine} width="64%" />

            <View style={styles.detailTags}>
                <Skeleton height={20} radius={10} width={62} />
                <Skeleton height={20} radius={10} width={48} />
                <Skeleton height={20} radius={10} width={70} />
            </View>

            <View style={styles.detailActions}>
                <Skeleton height={38} radius={8} style={styles.detailAction} />
                <Skeleton height={38} radius={8} style={styles.detailAction} />
            </View>
        </View>
    );
}

export function SkeletonMessageList({ count = 6 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonMessageRow key={index} />
            ))}
        </View>
    );
}

export function SkeletonMessageRow() {
    const { styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.row}>
            <View style={styles.ribbon} />

            <View style={styles.rowBody}>
                <Skeleton height={9} radius={4} width={64} />
                <Skeleton height={13} style={styles.rowTitle} width="72%" />
                <Skeleton height={11} style={styles.rowLine} width="94%" />
                <Skeleton height={11} style={styles.rowLine} width="58%" />

                <View style={styles.rowTags}>
                    <Skeleton height={18} radius={9} width={54} />
                    <Skeleton height={18} radius={9} width={38} />
                </View>
            </View>
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        block: { backgroundColor: palette.skeleton },
        detail: {
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingBottom: 18,
            paddingHorizontal: 20,
            paddingTop: 20,
        },
        detailAction: { flex: 1 },
        detailActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
        detailLine: { marginTop: 8 },
        detailTags: { flexDirection: 'row', gap: 6, marginTop: 14 },
        detailTitle: { marginTop: 12 },
        ribbon: {
            backgroundColor: palette.bgLine,
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
            paddingHorizontal: 20,
            paddingVertical: 14,
            position: 'relative',
        },
        rowBody: { flex: 1, paddingLeft: 12 },
        rowLine: { marginTop: 6 },
        rowTags: { flexDirection: 'row', gap: 6, marginTop: 8 },
        rowTitle: { marginTop: 8 },
    });
