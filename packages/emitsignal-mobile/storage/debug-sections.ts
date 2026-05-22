import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG_SECTIONS_KEY = '@emitsignal/debug_sections';

export interface DebugSections {
    showCurl: boolean;
    showDelivery: boolean;
    showPayload: boolean;
}

const DEFAULTS: DebugSections = {
    showCurl: false,
    showDelivery: false,
    showPayload: false,
};

export const saveDebugSections = async (sections: DebugSections) => {
    try {
        await AsyncStorage.setItem(DEBUG_SECTIONS_KEY, JSON.stringify(sections));
    } catch (error) {
        console.warn('Failed to save debug sections:', error);
    }
};

export const getDebugSections = async (): Promise<DebugSections> => {
    try {
        const raw = await AsyncStorage.getItem(DEBUG_SECTIONS_KEY);

        if (raw) {
            return { ...DEFAULTS, ...JSON.parse(raw) };
        }
    } catch (error) {
        console.warn('Failed to get debug sections:', error);
    }

    return { ...DEFAULTS };
};
