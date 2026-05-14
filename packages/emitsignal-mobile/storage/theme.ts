import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'user_theme_preference';

export type ThemePreference = 'dark' | 'light' | 'system';

export const saveThemePreference = async (theme: ThemePreference) => {
    try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Failed to save theme preference:', error);
    }
};

export const getThemePreference = async (): Promise<null | ThemePreference> => {
    try {
        return AsyncStorage.getItem(THEME_STORAGE_KEY) as unknown as null | ThemePreference;
    } catch (error) {
        console.warn('Failed to get theme preference:', error);

        return null;
    }
};
