import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { getThemePreference, saveThemePreference, ThemePreference } from '@/storage/theme';

interface ThemeContextType {
    currentScheme: 'dark' | 'light';
    setTheme: (theme: ThemePreference) => void;
    theme: ThemePreference;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useNativeColorScheme();
    const [theme, setThemeState] = useState<ThemePreference>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await getThemePreference();
            if (savedTheme) {
                setThemeState(savedTheme);
            }
            setIsLoaded(true);
        };
        loadTheme();
    }, []);

    const setTheme = (newTheme: ThemePreference) => {
        setThemeState(newTheme);
        saveThemePreference(newTheme);
    };

    const currentScheme: 'dark' | 'light' =
        theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;

    // Optional: Show nothing until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ currentScheme, setTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
