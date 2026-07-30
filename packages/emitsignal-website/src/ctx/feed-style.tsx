import { createContext, type ReactNode, useContext, useState } from 'react';

import { setPreferenceCookie } from '#/lib/cookies';
import { FEED_STYLE_KEY, type FeedStyle } from '#/lib/feed-style';

interface FeedStyleContextValue {
    feedStyle: FeedStyle;
    setFeedStyle: (feedStyle: FeedStyle) => void;
}

const FeedStyleContext = createContext<FeedStyleContextValue | undefined>(undefined);

/**
 * Dashboard-scoped feed-style provider. The preference (comfy/timeline/priority)
 * is stored in one cookie so the initial render matches the persisted choice.
 */
export function FeedStyleProvider({
    children,
    initialFeedStyle,
}: {
    children: ReactNode;
    initialFeedStyle: FeedStyle;
}) {
    const [feedStyle, setFeedStyleState] = useState<FeedStyle>(initialFeedStyle);

    const setFeedStyle = (next: FeedStyle) => {
        setFeedStyleState(next);

        if (typeof document !== 'undefined') {
            setPreferenceCookie(FEED_STYLE_KEY, next);
        }
    };

    return (
        <FeedStyleContext.Provider value={{ feedStyle, setFeedStyle }}>
            {children}
        </FeedStyleContext.Provider>
    );
}

export function useFeedStyle(): FeedStyleContextValue {
    const context = useContext(FeedStyleContext);

    if (context === undefined) {
        throw new Error('useFeedStyle must be used within a FeedStyleProvider');
    }

    return context;
}
