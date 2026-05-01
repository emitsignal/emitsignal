// Whinsper UI primitives — the violet dot, mono wordmark, topic avatar, code block.
// Lifted from the design canvas (lib/tokens.jsx) and adapted for React Native.

import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";

import { Fonts, PriorityColors, W } from "@/constants/theme";

// Deterministic hash → hue, matching design's WTopicAvatar
function hashHue(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
    }
    return h % 360;
}

// HSL → RGB (used to mimic oklch fallback for native)
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = (n: number) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface WLogoProps {
    size?: number;
    pulse?: boolean;
    color?: string;
    label?: string;
    labelStyle?: StyleProp<TextStyle>;
}

export function WLogo({
    size = 14,
    pulse = false,
    color = W.violet,
    label = "whinsper",
    labelStyle,
}: WLogoProps) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!pulse) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.55,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse, opacity]);

    return (
        <View style={[styles.logoRow, { gap: size * 0.55 }]}>
            <Animated.View
                style={{
                    width: size * 0.55,
                    height: size * 0.55,
                    borderRadius: size * 0.55,
                    backgroundColor: color,
                    opacity,
                }}
            />
            <Text
                style={[
                    {
                        fontFamily: Fonts.mono,
                        fontSize: size,
                        color: W.fg,
                        letterSpacing: -0.3,
                        fontWeight: "500",
                    },
                    labelStyle,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

interface WDotProps {
    level?: 1 | 2 | 3 | 4 | 5;
    size?: number;
    color?: string;
}

export function WDot({ level = 3, size = 6, color }: WDotProps) {
    const c = color ?? PriorityColors[level];
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size,
                backgroundColor: c,
            }}
        />
    );
}

interface WTopicAvatarProps {
    name: string;
    size?: number;
    rounded?: number;
    monogram?: string;
}

export function WTopicAvatar({
    name,
    size = 36,
    rounded = 8,
    monogram,
}: WTopicAvatarProps) {
    const hue = hashHue(name);
    const bg = hslToHex(hue, 30, 28);
    const fg = hslToHex(hue, 50, 80);
    const m =
        monogram ??
        name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: rounded,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text
                style={{
                    color: fg,
                    fontFamily: Fonts.mono,
                    fontWeight: "600",
                    fontSize: size * 0.36,
                    letterSpacing: -0.3,
                }}
            >
                {m}
            </Text>
        </View>
    );
}

interface WCodeProps {
    children: string;
    language?: string;
    style?: StyleProp<ViewStyle>;
}

export function WCode({ children, language, style }: WCodeProps) {
    return (
        <View style={[styles.code, style]}>
            {language ? (
                <Text style={styles.codeLanguage}>{language}</Text>
            ) : null}
            <Text style={styles.codeBody}>{children}</Text>
        </View>
    );
}

interface WChipProps {
    children: string;
    tone?: "default" | "violet" | "muted";
}

export function WChip({ children, tone = "default" }: WChipProps) {
    const palette = {
        default: { bg: W.bgChip, fg: W.fgMuted, border: W.bgLine },
        violet: { bg: W.violetBg, fg: W.violet, border: `${W.violetDim}55` },
        muted: { bg: "transparent", fg: W.fgDim, border: W.bgLine },
    }[tone];
    return (
        <View
            style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: palette.bg,
                borderColor: palette.border,
                borderWidth: StyleSheet.hairlineWidth,
            }}
        >
            <Text
                style={{
                    fontFamily: Fonts.mono,
                    fontSize: 10,
                    color: palette.fg,
                }}
            >
                {children}
            </Text>
        </View>
    );
}

interface ActivitySparklineProps {
    data: number[];
    color: string;
    height?: number;
    showTotal?: boolean;
}

export function ActivitySparkline({
    data,
    color,
    height = 14,
    showTotal = true,
}: ActivitySparklineProps) {
    const max = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);
    return (
        <View style={{ flexDirection: "row", alignItems: "flex-end", height }}>
            {data.map((v, i) => (
                <View
                    key={i}
                    style={{
                        flex: 1,
                        height: `${(v / max) * 100}%`,
                        minHeight: 1,
                        backgroundColor: color,
                        opacity: 0.4 + (v / max) * 0.6,
                        borderRadius: 1,
                        marginRight: i === data.length - 1 ? 0 : 2,
                    }}
                />
            ))}
            {showTotal ? (
                <Text
                    style={{
                        fontFamily: Fonts.mono,
                        fontSize: 9,
                        color: W.fgDim,
                        marginLeft: 6,
                    }}
                >
                    {total}/24h
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    code: {
        backgroundColor: "#06030f",
        borderColor: W.bgLine,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        padding: 12,
    },
    codeLanguage: {
        fontFamily: Fonts.mono,
        fontSize: 9.5,
        color: W.fgDim,
        marginBottom: 6,
        letterSpacing: 1.2,
    },
    codeBody: {
        fontFamily: Fonts.mono,
        fontSize: 11.5,
        lineHeight: 18,
        color: W.fg,
    },
});
