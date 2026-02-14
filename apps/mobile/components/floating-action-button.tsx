import { TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors, UI } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: string;
}

export function FloatingActionButton({
    onPress,
    icon = "plus",
}: FloatingActionButtonProps) {
    const colorScheme = useColorScheme();
    const backgroundColor =
        colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint;

    return (
        <TouchableOpacity
            style={[
                styles.fab,
                { backgroundColor },
                colorScheme === "dark" ? UI.shadow.large : UI.shadow.medium,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <IconSymbol name={icon} size={24} color="#ffffff" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
});
