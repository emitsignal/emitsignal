import { router } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { WLogo } from "@/components/whinsper";
import { Fonts, W } from "@/constants/theme";
import { useSession } from "@/ctx/session";
import { useTheme } from "@/ctx/theme";
import type { ThemePreference } from "@/storage/theme";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
];

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme();
    const { user, signOut } = useSession();

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <WLogo size={12} pulse />
                </View>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>
                    {user?.email ?? "anonymous device"}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <SectionLabel>APPEARANCE</SectionLabel>
                <View style={styles.group}>
                    {THEME_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => setTheme(opt.value)}
                            style={[
                                styles.row,
                                opt.value === theme && styles.rowActive,
                            ]}
                        >
                            <Text style={styles.rowLabel}>{opt.label}</Text>
                            {opt.value === theme ? (
                                <IconSymbol
                                    name="checkmark.circle.fill"
                                    size={18}
                                    color={W.violet}
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
                            <Text style={[styles.rowLabel, { color: W.red }]}>
                                Sign out
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={() => router.push("/auth")}
                            style={styles.row}
                        >
                            <Text
                                style={[styles.rowLabel, { color: W.violet }]}
                            >
                                Sign in
                            </Text>
                            <IconSymbol
                                name="arrow.right"
                                size={14}
                                color={W.violet}
                            />
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
    root: { flex: 1, backgroundColor: W.bg },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: W.fg,
        letterSpacing: -0.5,
    },
    subtitle: {
        marginTop: 4,
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: W.fgMuted,
    },
    sectionLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 6,
    },
    sectionLabelText: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: W.fgDim,
        letterSpacing: 1.5,
        fontWeight: "500",
    },
    sectionLabelLine: {
        flex: 1,
        height: 1,
        marginLeft: 10,
        backgroundColor: W.bgLine,
    },
    group: {
        backgroundColor: W.bgElev,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: W.bgLine,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: W.bgLine,
    },
    rowActive: { backgroundColor: W.violetBg },
    rowLabel: { fontSize: 14, color: W.fg, flex: 1 },
    rowValue: { fontFamily: Fonts.mono, fontSize: 12, color: W.fgMuted },
});
