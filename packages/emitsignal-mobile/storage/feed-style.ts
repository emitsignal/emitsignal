import AsyncStorage from '@react-native-async-storage/async-storage';

const FEED_STYLE_KEY = '@emitsignal/feed_style_preference';

export type FeedStyle = 'comfy' | 'priority' | 'timeline';

export const saveFeedStyle = async (style: FeedStyle): Promise<void> => {
    try {
        await AsyncStorage.setItem(FEED_STYLE_KEY, style);
    } catch (error) {
        console.warn('Failed to save feed style preference:', error);
    }
};

export const getFeedStyle = async (): Promise<FeedStyle | null> => {
    try {
        return AsyncStorage.getItem(FEED_STYLE_KEY) as unknown as FeedStyle | null;
    } catch (error) {
        console.warn('Failed to get feed style preference:', error);

        return null;
    }
};
