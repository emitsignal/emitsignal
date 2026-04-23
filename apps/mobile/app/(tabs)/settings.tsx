import { StyleSheet, TouchableOpacity, ScrollView, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/ctx/theme";
import { ThemePreference } from "@/storage/theme";

function SectionHeader({ title }: { title: string }) {
    return (
        <ThemedText style={styles.sectionHeader} type="defaultSemiBold">
            {title}
        </ThemedText>
    );
}

function SettingItem({
    label,
    icon,
    value,
    onPress,
    showChevron = true,
}: {
    label: string;
    icon: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
}) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <TouchableOpacity
            style={[
                styles.settingItem,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                },
            ]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingStart}>
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <IconSymbol name={icon} size={20} color={colors.icon} />
                </View>
                <ThemedText style={styles.settingLabel}>{label}</ThemedText>
            </View>

            <View style={styles.settingEnd}>
                {value && (
                    <ThemedText style={styles.settingValue}>{value}</ThemedText>
                )}
                {showChevron && (
                    <IconSymbol
                        name="chevron.right"
                        size={16}
                        color={colors.icon}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

function ThemeOption({
    label,
    value,
    isSelected,
    onSelect,
}: {
    label: string;
    value: ThemePreference;
    isSelected: boolean;
    onSelect: (theme: ThemePreference) => void;
}) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <TouchableOpacity
            style={[
                styles.themeOption,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                },
            ]}
            onPress={() => onSelect(value)}
            activeOpacity={0.8}
        >
            <View style={styles.themeOptionContent}>
                <ThemedText
                    style={[
                        styles.themeOptionLabel,
                        isSelected && {
                            color: colors.tint,
                            fontWeight: "600",
                        },
                    ]}
                >
                    {label}
                </ThemedText>
                {isSelected && (
                    <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color={colors.tint}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme();
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

    return (
        <ThemedView style={styles.container}>
            <ThemedView
                style={[styles.header, { borderBottomColor: colors.border }]}
            >
                <ThemedText type="title">Settings</ThemedText>
            </ThemedView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SectionHeader title="Appearance" />
                <View style={styles.themeSelector}>
                    <ThemeOption
                        label="System"
                        value="system"
                        isSelected={theme === "system"}
                        onSelect={setTheme}
                    />
                    <ThemeOption
                        label="Light"
                        value="light"
                        isSelected={theme === "light"}
                        onSelect={setTheme}
                    />
                    <ThemeOption
                        label="Dark"
                        value="dark"
                        isSelected={theme === "dark"}
                        onSelect={setTheme}
                    />
                </View>

                <SectionHeader title="Notifications" />
                <SettingItem
                    label="Push Notifications"
                    icon="bell.badge"
                    value="Enabled"
                    onPress={() => {}}
                />
                <SettingItem
                    label="Background Refresh"
                    icon="arrow.triangle.2.circlepath"
                    value="On"
                    onPress={() => {}}
                />

                <SectionHeader title="About" />
                <SettingItem
                    label="Version"
                    icon="info.circle"
                    value="1.0.0"
                    showChevron={false}
                />
                <SettingItem
                    label="Privacy Policy"
                    icon="hand.raised"
                    onPress={() => {}}
                />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: UI.spacing.lg,
        paddingHorizontal: UI.spacing.lg,
        borderBottomWidth: 1,
    },
    scrollContent: {
        padding: UI.spacing.lg,
        paddingBottom: 100,
    },
    sectionHeader: {
        marginTop: UI.spacing.xl,
        marginBottom: UI.spacing.md,
        fontSize: 14,
        textTransform: "uppercase",
        opacity: 0.6,
        letterSpacing: 0.5,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: UI.spacing.md,
        borderRadius: UI.borderRadius.medium,
        borderWidth: 1,
        marginBottom: UI.spacing.sm,
    },
    settingStart: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.md,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingEnd: {
        flexDirection: "row",
        alignItems: "center",
        gap: UI.spacing.xs,
    },
    settingValue: {
        fontSize: 14,
        opacity: 0.6,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: UI.borderRadius.small,
        justifyContent: "center",
        alignItems: "center",
    },
    themeSelector: {
        gap: UI.spacing.sm,
    },
    themeOption: {
        padding: UI.spacing.md,
        borderRadius: UI.borderRadius.medium,
        borderWidth: 1,
    },
    themeOptionContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    themeOptionLabel: {
        fontSize: 16,
    },
});
