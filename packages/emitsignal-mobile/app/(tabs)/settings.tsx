import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ThemePreference } from "@/storage/theme";

import { WLogo } from "@/components/base-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, W } from "@/constants/theme";
import { useSession } from "@/ctx/session";
import { useTheme } from "@/ctx/theme";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
];

export default function SettingsScreen() {
    const { setTheme, theme } = useTheme();
    const { signOut, user } = useSession();

    return (
        <SafeAreaView edges={["top"]} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo pulse size={12} />
                </View>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>{user?.email ?? "anonymous device"}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <SectionLabel>APPEARANCE</SectionLabel>
                <View style={styles.group}>
                    {THEME_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setTheme(opt.value)}
                            style={[styles.row, opt.value === theme && styles.rowActive]}
                        >
                            <Text style={styles.rowLabel}>{opt.label}</Text>
                            {opt.value === theme ? (
                                <IconSymbol
                                    color={W.violet}
                                    name="checkmark.circle.fill"
                                    size={18}
                                />
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                <SectionLabel>NOTIFICATIONS</SectionLabel>
                <View style={styles.group}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Push</Text>
                        <Text style={styles.rowValue}>enabled</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>In-app banners</Text>
                        <Text style={styles.rowValue}>enabled</Text>
                    </View>
                </View>

                <SectionLabel>ACCOUNT</SectionLabel>
                <View style={styles.group}>
                    {user ? (
                        <Pressable
                            onPress={async () => {
                                await signOut();
                                router.replace("/auth");
                            }}
                            style={styles.row}
                        >
                            <Text style={[styles.rowLabel, { color: W.red }]}>Sign out</Text>
                        </Pressable>
                    ) : (
                        <Pressable onPress={() => router.push("/auth")} style={styles.row}>
                            <Text style={[styles.rowLabel, { color: W.violet }]}>Sign in</Text>
                            <IconSymbol color={W.violet} name="arrow.right" size={14} />
                        </Pressable>
                    )}
                </View>

                <SectionLabel>ABOUT</SectionLabel>
                <View style={styles.group}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Version</Text>
                        <Text style={styles.rowValue}>0.1.0</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        backgroundColor: W.bgElev,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
    headerTop: { alignItems: "center", flexDirection: "row", marginBottom: 16 },
    root: { backgroundColor: W.bg, flex: 1 },
    row: {
        alignItems: "center",
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    rowActive: { backgroundColor: W.violetBg },
    rowLabel: { color: W.fg, flex: 1, fontSize: 14 },
    rowValue: { color: W.fgMuted, fontFamily: Fonts.mono, fontSize: 12 },
    sectionLabelLine: {
        backgroundColor: W.bgLine,
        flex: 1,
        height: 1,
        marginLeft: 10,
    },
    sectionLabelRow: {
        alignItems: "center",
        flexDirection: "row",
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    sectionLabelText: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        fontWeight: "500",
        letterSpacing: 1.5,
    },
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
