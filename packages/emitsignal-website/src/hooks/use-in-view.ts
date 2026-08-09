import { useEffect, useRef, useState } from 'react';

interface UseInViewResult {
    /** True once the element has entered the viewport. Stays true afterwards. */
    inView: boolean;
    /**
     * False during SSR and until the observer is attached, so callers can render
     * content fully visible when JavaScript never runs instead of leaving it at
     * `opacity: 0` forever.
     */
    ready: boolean;
    ref: React.RefObject<HTMLDivElement | null>;
}

/**
 * Fires once when an element scrolls into view. Used to drive the `signal-rise`
 * reveal on the landing sections without pulling in an animation library.
 */
export function useInView(threshold = 0.15): UseInViewResult {
    const ref = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element || typeof IntersectionObserver === 'undefined') {
            setInView(true);

            return;
        }

        setReady(true);

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setInView(true);
                        observer.disconnect();
                    }
                }
            },
            { threshold },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold]);

    return { inView, ready, ref };
}
