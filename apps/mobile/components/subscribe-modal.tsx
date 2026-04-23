import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Keyboard,
    Pressable,
} from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Colors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "./ui/icon-symbol";
import { useState } from "react";

interface SubscribeModalContentProps {
    onSubscribe: (topicName: string, description: string, instantDelivery: boolean) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export function SubscribeModalContent({
    onSubscribe,
    onClose,
    isLoading = false,
}: SubscribeModalContentProps) {
    const colorScheme = useColorScheme();
    const [topicName, setTopicName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("bell");
    const [selectedColor, setSelectedColor] = useState(Colors.light.tint);
    const [instantDelivery, setInstantDelivery] = useState(true);

    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    const iconOptions = [
        "bell",
        "globe",
        "server.rack",
        "envelope",
        "megaphone",
        "chart.bar",
    ];

    const colorOptions = [
        Colors.light.tint,
        Colors.light.info,
        Colors.light.warning,
        Colors.light.error,
        Colors.light.success,
        "#9b59b6",
    ];

    const handleSubscribe = () => {
        if (topicName.trim() && !isLoading) {
            onSubscribe(topicName.trim(), description.trim(), instantDelivery);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Subscribe to topic</ThemedText>
                <TouchableOpacity onPress={onClose}>
                    <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
            </ThemedView>

            <Pressable onPress={Keyboard.dismiss} style={styles.content}>
                <ThemedView style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Topic name</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.cardBackground,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="e.g. my-backups"
                        placeholderTextColor={colors.icon}
                        value={topicName}
                        onChangeText={setTopicName}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                    <ThemedText style={styles.label}>
                        Description (optional)
                    </ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            styles.textArea,
                            {
                                backgroundColor: colors.cardBackground,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="What's this topic for?"
                        placeholderTextColor={colors.icon}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Icon & Color</ThemedText>
                    <ThemedView style={styles.iconColorContainer}>
                        <View
                            style={[
                                styles.iconPreview,
                                { backgroundColor: selectedColor },
                            ]}
                        >
                            <IconSymbol
                                name={selectedIcon}
                                size={32}
                                color="#ffffff"
                            />
                        </View>
                        <ThemedText style={styles.previewLabel}>
                            {selectedIcon}
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.optionsRow}>
                        {iconOptions.map((icon) => (
                            <TouchableOpacity
                                key={icon}
                                onPress={() => setSelectedIcon(icon)}
                                style={[
                                    styles.iconOption,
                                    {
                                        backgroundColor:
                                            selectedIcon === icon
                                                ? colors.tint
                                                : colors.cardBackground,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <IconSymbol
                                    name={icon}
                                    size={20}
                                    color={
                                        selectedIcon === icon
                                            ? "#ffffff"
                                            : colors.icon
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </ThemedView>

                    <ThemedView style={styles.optionsRow}>
                        {colorOptions.map((color) => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => setSelectedColor(color)}
                                style={[
                                    styles.colorOption,
                                    {
                                        backgroundColor: color,
                                        borderWidth:
                                            selectedColor === color ? 3 : 0,
                                        borderColor: colors.text,
                                    },
                                ]}
                            />
                        ))}
                    </ThemedView>
                </ThemedView>

                <ThemedView style={styles.deliveryOption}>
                    <ThemedView style={styles.deliveryRow}>
                        <IconSymbol
                            name="bell.badge"
                            size={20}
                            color={colors.icon}
                        />
                        <ThemedView style={styles.deliveryText}>
                            <ThemedText style={styles.deliveryTitle}>
                                Instant delivery
                            </ThemedText>
                            <ThemedText style={styles.deliverySubtitle}>
                                Get notified immediately
                            </ThemedText>
                        </ThemedView>
                    </ThemedView>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            {
                                backgroundColor: instantDelivery
                                    ? colors.tint
                                    : colors.icon,
                            },
                        ]}
                        onPress={() => setInstantDelivery(!instantDelivery)}
                        activeOpacity={0.8}
                    >
                        <View
                            style={[
                                styles.toggleKnob,
                                {
                                    transform: [
                                        {
                                            translateX: instantDelivery ? 20 : 2,
                                        },
                                    ],
                                    backgroundColor: "#ffffff",
                                },
                            ]}
                        />
                    </TouchableOpacity>
                </ThemedView>

                <TouchableOpacity
                    style={[
                        styles.subscribeButton,
                        {
                            backgroundColor: topicName.trim()
                                ? colors.tint
                                : colors.icon,
                            opacity: isLoading ? 0.7 : 1,
                        },
                    ]}
                    onPress={handleSubscribe}
                    disabled={!topicName.trim() || isLoading}
                >
                    <ThemedText style={styles.subscribeButtonText}>
                        {isLoading ? "Subscribing..." : "Subscribe"}
                    </ThemedText>
                </TouchableOpacity>
            </Pressable>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: UI.spacing.lg,
        paddingBottom: UI.spacing.lg,
    },
    content: {
        paddingHorizontal: UI.spacing.lg,
    },
    inputGroup: {
        marginBottom: UI.spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: UI.spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: UI.borderRadius.medium,
        paddingHorizontal: UI.spacing.md,
        paddingVertical: UI.spacing.md,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    iconColorContainer: {
        alignItems: "center",
        marginBottom: UI.spacing.md,
    },
    iconPreview: {
        width: 64,
        height: 64,
        borderRadius: UI.borderRadius.full,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: UI.spacing.sm,
    },
    previewLabel: {
        fontSize: 12,
        opacity: 0.6,
    },
    optionsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: UI.spacing.md,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: UI.borderRadius.medium,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: UI.borderRadius.full,
    },
    deliveryOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: UI.spacing.md,
        marginBottom: UI.spacing.xl,
    },
    deliveryRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.md,
    },
    deliveryText: {
        gap: 2,
    },
    deliveryTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    deliverySubtitle: {
        fontSize: 12,
        opacity: 0.6,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        position: "absolute",
    },
    subscribeButton: {
        paddingVertical: UI.spacing.lg,
        borderRadius: UI.borderRadius.medium,
        alignItems: "center",
    },
    subscribeButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
});
