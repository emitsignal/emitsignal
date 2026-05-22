import React, { createContext, useContext, useEffect, useState } from 'react';

import type { DebugSections } from '@/storage/debug-sections';

import { getDebugSections, saveDebugSections } from '@/storage/debug-sections';

interface DebugSectionsContextType {
    sections: DebugSections;
    setSection: (key: keyof DebugSections, value: boolean) => void;
}

const DebugSectionsContext = createContext<DebugSectionsContextType | undefined>(undefined);

export function DebugSectionsProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [sections, setSections] = useState<DebugSections>({
        showCurl: false,
        showDelivery: false,
        showPayload: false,
    });

    useEffect(() => {
        getDebugSections().then((saved) => {
            setSections(saved);
            setIsLoaded(true);
        });
    }, []);

    const setSection = (key: keyof DebugSections, value: boolean) => {
        const next = { ...sections, [key]: value };

        setSections(next);
        saveDebugSections(next);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <DebugSectionsContext.Provider value={{ sections, setSection }}>
            {children}
        </DebugSectionsContext.Provider>
    );
}

export function useDebugSections() {
    const context = useContext(DebugSectionsContext);

    if (context === undefined) {
        throw new Error('useDebugSections must be used within a DebugSectionsProvider');
    }

    return context;
}
