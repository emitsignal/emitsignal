import React, { createContext, useContext, useEffect, useState } from 'react';

import { type FeedStyle, getFeedStyle, saveFeedStyle } from '@/storage/feed-style';

interface FeedStyleContextType {
    feedStyle: FeedStyle;
    setFeedStyle: (style: FeedStyle) => void;
}

const FeedStyleContext = createContext<FeedStyleContextType | undefined>(undefined);

export function FeedStyleProvider({ children }: { children: React.ReactNode }) {
    const [feedStyle, setFeedStyleState] = useState<FeedStyle>('comfy');

    useEffect(() => {
        getFeedStyle().then((saved) => {
            if (saved) {
                setFeedStyleState(saved);
            }
        });
    }, []);

    const setFeedStyle = (style: FeedStyle) => {
        setFeedStyleState(style);
        saveFeedStyle(style);
    };

    return (
        <FeedStyleContext.Provider value={{ feedStyle, setFeedStyle }}>
            {children}
        </FeedStyleContext.Provider>
    );
}

export function useFeedStyle() {
    const context = useContext(FeedStyleContext);
    if (context === undefined) {
        throw new Error('useFeedStyle must be used within a FeedStyleProvider');
    }
    return context;
}
