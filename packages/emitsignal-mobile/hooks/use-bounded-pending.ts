import { useEffect, useState } from 'react';

/**
 * Returns `true` while `pending` is set, but only up to `timeoutMs`. After the
 * timeout it returns `false` even if `pending` is still true, so a stalled
 * prerequisite (e.g. a session check that never resolves) can never keep a
 * screen in a perpetual loading state.
 */
export function useBoundedPending(pending: boolean, timeoutMs = 10_000): boolean {
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        if (!pending) {
            setTimedOut(false);

            return;
        }

        const id = setTimeout(() => setTimedOut(true), timeoutMs);

        return () => clearTimeout(id);
    }, [pending, timeoutMs]);

    return pending && !timedOut;
}
