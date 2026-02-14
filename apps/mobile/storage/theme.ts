import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "user_theme_preference";

export type ThemePreference = "light" | "dark" | "system";

export const saveThemePreference = async (theme: ThemePreference) => {
    try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
        console.warn("Failed to save theme preference:", e);
    }
};

export const getThemePreference = async (): Promise<ThemePreference | null> => {
    try {
        const theme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        return theme as ThemePreference | null;
    } catch (e) {
        console.warn("Failed to get theme preference:", e);
        return null;
    }
};
