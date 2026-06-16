import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Fonts, W } from '@/constants/theme';

interface AnimatedSplashProps {
    onFinish: () => void;
}

// Geometry mirrors the design bundle's Pulse splash (lib/splash.jsx).
const DOT = 84;
const HALO = 185;
const RING = 240;
const FIELD = RING;

const BLOOM = Easing.bezier(0.2, 0.7, 0.3, 1);
const RISE = Easing.bezier(0.2, 0.8, 0.2, 1);
const SETTLE = Easing.bezier(0.2, 0.85, 0.25, 1);

// "Ignition": the dot blooms in, two rings radiate outward, the wordmark and
// tagline rise, then the whole intro fades to reveal the app underneath.
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

    const dotOpacity = useSharedValue(0);
    const dotScale = useSharedValue(0.25);
    const haloOpacity = useSharedValue(0);
    const haloScale = useSharedValue(0.55);
    const loadOpacity = useSharedValue(0);
    const ring1Opacity = useSharedValue(0);
    const ring1Scale = useSharedValue(0.18);
    const ring2Opacity = useSharedValue(0);
    const ring2Scale = useSharedValue(0.18);
    const root = useSharedValue(1);
    const sweep = useSharedValue(0);
    const tagOpacity = useSharedValue(0);
    const tagY = useSharedValue(12);
    const wordOpacity = useSharedValue(0);
    const wordY = useSharedValue(12);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }, []);

    useEffect(() => {
        if (reduceMotion === null) {
            return;
        }

        const finish = () => {
            'worklet';
            root.value = withDelay(
                reduceMotion ? 500 : 2500,
                withTiming(0, { duration: 550 }, (done) => {
                    if (done) {
                        runOnJS(onFinish)();
                    }
                }),
            );
        };

        if (reduceMotion) {
            dotOpacity.value = 1;
            dotScale.value = 1;
            haloOpacity.value = 1;
            haloScale.value = 1;
            loadOpacity.value = 1;
            tagOpacity.value = 1;
            tagY.value = 0;
            wordOpacity.value = 1;
            wordY.value = 0;

            finish();

            return;
        }

        dotScale.value = withTiming(1, { duration: 1000, easing: SETTLE });
        dotOpacity.value = withTiming(1, { duration: 550 });

        haloOpacity.value = withTiming(1, { duration: 1300 });
        haloScale.value = withSequence(
            withTiming(1, { duration: 1300, easing: Easing.out(Easing.ease) }),
            withRepeat(
                withSequence(
                    withTiming(1.12, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
            ),
        );

        ring1Scale.value = withDelay(350, withTiming(1, { duration: 1900, easing: BLOOM }));
        ring1Opacity.value = withDelay(
            350,
            withSequence(withTiming(0.55, { duration: 420 }), withTiming(0, { duration: 1480 })),
        );
        ring2Scale.value = withDelay(720, withTiming(1, { duration: 1900, easing: BLOOM }));
        ring2Opacity.value = withDelay(
            720,
            withSequence(withTiming(0.55, { duration: 420 }), withTiming(0, { duration: 1480 })),
        );

        loadOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
        tagOpacity.value = withDelay(1150, withTiming(1, { duration: 900 }));
        tagY.value = withDelay(1150, withTiming(0, { duration: 900, easing: RISE }));
        wordOpacity.value = withDelay(850, withTiming(1, { duration: 900 }));
        wordY.value = withDelay(850, withTiming(0, { duration: 900, easing: RISE }));
        sweep.value = withDelay(
            1300,
            withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1),
        );

        finish();
    }, [
        dotOpacity,
        dotScale,
        haloOpacity,
        haloScale,
        loadOpacity,
        onFinish,
        reduceMotion,
        ring1Opacity,
        ring1Scale,
        ring2Opacity,
        ring2Scale,
        root,
        sweep,
        tagOpacity,
        tagY,
        wordOpacity,
        wordY,
    ]);

    const rootStyle = useAnimatedStyle(() => ({ opacity: root.value }));
    const dotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
        transform: [{ scale: dotScale.value }],
    }));
    const haloStyle = useAnimatedStyle(() => ({
        opacity: haloOpacity.value,
        transform: [{ scale: haloScale.value }],
    }));
    const ring1Style = useAnimatedStyle(() => ({
        opacity: ring1Opacity.value,
        transform: [{ scale: ring1Scale.value }],
    }));
    const ring2Style = useAnimatedStyle(() => ({
        opacity: ring2Opacity.value,
        transform: [{ scale: ring2Scale.value }],
    }));
    const wordStyle = useAnimatedStyle(() => ({
        opacity: wordOpacity.value,
        transform: [{ translateY: wordY.value }],
    }));
    const tagStyle = useAnimatedStyle(() => ({
        opacity: tagOpacity.value,
        transform: [{ translateY: tagY.value }],
    }));
    const loadStyle = useAnimatedStyle(() => ({ opacity: loadOpacity.value }));
    const sweepStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -44 + sweep.value * 144 }],
    }));

    return (
        <Animated.View pointerEvents="none" style={[styles.root, rootStyle]}>
            <View style={styles.field}>
                <Animated.View style={[styles.ring, ring2Style]} />
                <Animated.View style={[styles.ring, ring1Style]} />
                <Animated.View style={[styles.halo, haloStyle]} />
                <Animated.View style={[styles.dot, dotStyle]} />
            </View>

            <Animated.View style={[styles.wordRow, wordStyle]}>
                <View style={styles.wordDot} />
                <Text style={styles.word}>EmitSignal</Text>
            </Animated.View>
            <Animated.Text style={[styles.tag, tagStyle]}>signals for builders</Animated.Text>

            <Animated.View style={[styles.loadLine, loadStyle]}>
                <Animated.View style={[styles.loadBar, sweepStyle]} />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    dot: {
        backgroundColor: W.violet,
        borderRadius: DOT / 2,
        elevation: 18,
        height: DOT,
        position: 'absolute',
        shadowColor: W.violet,
        shadowOffset: { height: 0, width: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 28,
        width: DOT,
    },
    field: {
        alignItems: 'center',
        height: FIELD,
        justifyContent: 'center',
        width: FIELD,
    },
    halo: {
        backgroundColor: 'rgba(124,58,237,0.28)',
        borderRadius: HALO / 2,
        height: HALO,
        position: 'absolute',
        width: HALO,
    },
    loadBar: {
        backgroundColor: W.violet,
        borderRadius: 2,
        height: '100%',
        width: '40%',
    },
    loadLine: {
        backgroundColor: W.bgLine,
        borderRadius: 2,
        height: 2,
        marginTop: 24,
        overflow: 'hidden',
        width: 110,
    },
    ring: {
        borderColor: 'rgba(167,139,250,0.55)',
        borderRadius: RING / 2,
        borderWidth: 1.5,
        height: RING,
        position: 'absolute',
        width: RING,
    },
    root: {
        alignItems: 'center',
        backgroundColor: W.bg,
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 100,
    },
    tag: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        letterSpacing: 3.5,
        marginTop: 10,
    },
    word: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 28,
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    wordDot: {
        backgroundColor: W.violet,
        borderRadius: 6,
        height: 12,
        shadowColor: W.violet,
        shadowOffset: { height: 0, width: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        width: 12,
    },
    wordRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 36,
    },
});
