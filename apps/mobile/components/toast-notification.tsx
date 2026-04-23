import React, { useEffect, useRef, useCallback } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import { Colors, PriorityColors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "./ui/icon-symbol";

interface ToastNotificationProps {
    title: string;
    body: string;
    priority?: 1 | 2 | 3 | 4 | 5;
    visible: boolean;
    onPress?: () => void;
    onDismiss?: () => void;
    duration?: number;
}

export function ToastNotification({
    title,
    body,
    priority = 3,
    visible,
    onPress,
    onDismiss,
    duration = 4000,
}: ToastNotificationProps) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
    const priorityColor = PriorityColors[priority];
    
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const handleDismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss?.();
        });
    }, [translateY, opacity, onDismiss]);

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after duration
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            handleDismiss();
        }
    }, [visible, duration, handleDismiss, translateY, opacity]);

    const handlePress = () => {
        handleDismiss();
        onPress?.();
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.9}
                style={[
                    styles.toast,
                    {
                        backgroundColor: colors.cardBackground,
                        borderLeftColor: priorityColor,
                        shadowColor: colors.text,
                    },
                ]}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <IconSymbol
                            name="bell.fill"
                            size={16}
                            color={priorityColor}
                        />
                        <ThemedText
                            type="defaultSemiBold"
                            style={styles.title}
                            numberOfLines={1}
                        >
                            {title}
                        </ThemedText>
                        <TouchableOpacity
                            onPress={handleDismiss}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <IconSymbol
                                name="xmark"
                                size={16}
                                color={colors.icon}
                            />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={styles.body} numberOfLines={2}>
                        {body}
                    </ThemedText>
                </View>
                <View
                    style={[
                        styles.priorityIndicator,
                        { backgroundColor: priorityColor },
                    ]}
                />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: UI.spacing.md,
        paddingTop: 60,
    },
    toast: {
        borderRadius: UI.borderRadius.medium,
        borderLeftWidth: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        overflow: "hidden",
    },
    content: {
        padding: UI.spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.sm,
        marginBottom: UI.spacing.xs,
    },
    title: {
        flex: 1,
        fontSize: 14,
    },
    closeButton: {
        padding: UI.spacing.xs,
    },
    body: {
        fontSize: 13,
        opacity: 0.8,
        lineHeight: 18,
    },
    priorityIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
});
