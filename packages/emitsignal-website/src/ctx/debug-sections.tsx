import { createContext, type ReactNode, useContext, useState } from 'react';

import { setPreferenceCookie } from '#/lib/cookies';
import { DEBUG_SECTIONS_KEY, type DebugSections } from '#/lib/debug-sections';

interface DebugSectionsContextValue {
    sections: DebugSections;
    setSection: (key: keyof DebugSections, value: boolean) => void;
}

const DebugSectionsContext = createContext<DebugSectionsContextValue | undefined>(undefined);

/**
 * Dashboard-scoped debug-sections provider. The toggles (payload/curl/delivery)
 * are stored as one JSON cookie so the initial render matches the persisted choice.
 */
export function DebugSectionsProvider({
    children,
    initialSections,
}: {
    children: ReactNode;
    initialSections: DebugSections;
}) {
    const [sections, setSections] = useState<DebugSections>(initialSections);

    const setSection = (key: keyof DebugSections, value: boolean) => {
        const next = { ...sections, [key]: value };

        setSections(next);

        if (typeof document !== 'undefined') {
            const encoded = encodeURIComponent(JSON.stringify(next));

            setPreferenceCookie(DEBUG_SECTIONS_KEY, encoded);
        }
    };

    return (
        <DebugSectionsContext.Provider value={{ sections, setSection }}>
            {children}
        </DebugSectionsContext.Provider>
    );
}

export function useDebugSections(): DebugSectionsContextValue {
    const context = useContext(DebugSectionsContext);

    if (context === undefined) {
        throw new Error('useDebugSections must be used within a DebugSectionsProvider');
    }

    return context;
}
