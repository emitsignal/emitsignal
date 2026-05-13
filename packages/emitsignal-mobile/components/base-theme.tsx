import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    type StyleProp,
    StyleSheet,
    Text,
    type TextStyle,
    View,
    type ViewStyle,
} from "react-native";

import { Fonts, PriorityColors, W } from "@/constants/theme";

interface ActivitySparklineProps {
    color: string;
    data: number[];
    height?: number;
    showTotal?: boolean;
}

interface WChipProps {
    children: string;
    tone?: "default" | "muted" | "violet";
}

interface WCodeProps {
    children: string;
    language?: string;
    style?: StyleProp<ViewStyle>;
}

interface WDotProps {
    color?: string;
    level?: 1 | 2 | 3 | 4 | 5;
    size?: number;
}

interface WLogoProps {
    color?: string;
    label?: string;
    labelStyle?: StyleProp<TextStyle>;
    pulse?: boolean;
    size?: number;
}

interface WTopicAvatarProps {
    monogram?: string;
    name: string;
    rounded?: number;
    size?: number;
}

export function ActivitySparkline({
    color,
    data,
    height = 14,
    showTotal = true,
}: ActivitySparklineProps) {
    const max = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);
    return (
        <View style={{ alignItems: "flex-end", flexDirection: "row", height }}>
            {data.map((v, i) => (
                <View
                    key={i}
                    style={{
                        backgroundColor: color,
                        borderRadius: 1,
                        flex: 1,
                        height: `${(v / max) * 100}%`,
                        marginRight: i === data.length - 1 ? 0 : 2,
                        minHeight: 1,
                        opacity: 0.4 + (v / max) * 0.6,
                    }}
                />
            ))}
            {showTotal ? (
                <Text
                    style={{
                        color: W.fgDim,
                        fontFamily: Fonts.mono,
                        fontSize: 9,
                        marginLeft: 6,
                    }}
                >
                    {total}/24h
                </Text>
            ) : null}
        </View>
    );
}

export function WChip({ children, tone = "default" }: WChipProps) {
    const palette = {
        default: { bg: W.bgChip, border: W.bgLine, fg: W.fgMuted },
        muted: { bg: "transparent", border: W.bgLine, fg: W.fgDim },
        violet: { bg: W.violetBg, border: `${W.violetDim}55`, fg: W.violet },
    }[tone];
    return (
        <View
            style={{
                backgroundColor: palette.bg,
                borderColor: palette.border,
                borderRadius: 4,
                borderWidth: StyleSheet.hairlineWidth,
                paddingHorizontal: 8,
                paddingVertical: 2,
            }}
        >
            <Text
                style={{
                    color: palette.fg,
                    fontFamily: Fonts.mono,
                    fontSize: 10,
                }}
            >
                {children}
            </Text>
        </View>
    );
}

export function WCode({ children, language, style }: WCodeProps) {
    return (
        <View style={[styles.code, style]}>
            {language ? <Text style={styles.codeLanguage}>{language}</Text> : null}
            <Text style={styles.codeBody}>{children}</Text>
        </View>
    );
}

export function WDot({ color, level = 3, size = 6 }: WDotProps) {
    const c = color ?? PriorityColors[level];
    return (
        <View
            style={{
                backgroundColor: c,
                borderRadius: size,
                height: size,
                width: size,
            }}
        />
    );
}

export function WLogo({
    color = W.violet,
    label = "EmitSignal",
    labelStyle,
    pulse = false,
    size = 14,
}: WLogoProps) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!pulse) {
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 0.55,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    toValue: 1,
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
                    backgroundColor: color,
                    borderRadius: size * 0.55,
                    height: size * 0.55,
                    opacity,
                    width: size * 0.55,
                }}
            />
            <Text
                style={[
                    {
                        color: W.fg,
                        fontFamily: Fonts.mono,
                        fontSize: size,
                        fontWeight: "500",
                        letterSpacing: -0.3,
                    },
                    labelStyle,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

export function WTopicAvatar({ monogram, name, rounded = 8, size = 36 }: WTopicAvatarProps) {
    const hue = hashHue(name);
    const bg = hslToHex(hue, 30, 28);
    const fg = hslToHex(hue, 50, 80);
    const m =
        monogram ??
        name
            .replace(/[^a-z0-9]/gi, "")
            .slice(0, 2)
            .toUpperCase();
    return (
        <View
            style={{
                alignItems: "center",
                backgroundColor: bg,
                borderRadius: rounded,
                height: size,
                justifyContent: "center",
                width: size,
            }}
        >
            <Text
                style={{
                    color: fg,
                    fontFamily: Fonts.mono,
                    fontSize: size * 0.36,
                    fontWeight: "600",
                    letterSpacing: -0.3,
                }}
            >
                {m}
            </Text>
        </View>
    );
}

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
    let b: number, g: number, r: number;
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

const styles = StyleSheet.create({
    code: {
        backgroundColor: "#06030f",
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 12,
    },
    codeBody: {
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 11.5,
        lineHeight: 18,
    },
    codeLanguage: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 9.5,
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    logoRow: {
        alignItems: "center",
        flexDirection: "row",
    },
});
