import { useTheme } from "@/ctx/theme";

export function useColorScheme() {
    const { currentScheme } = useTheme();
    return currentScheme;
}
