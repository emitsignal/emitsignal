import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';

export type ToastKind = 'danger' | 'ok' | 'warn';

interface ToastContextValue {
    toast: (message: string, kind?: ToastKind) => void;
}

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

const KIND_COLOR: Record<ToastKind, string> = {
    danger: 'var(--color-danger)',
    ok: 'var(--color-success)',
    warn: 'var(--color-warn)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const toast = useCallback(
        (message: string, kind: ToastKind = 'ok') => {
            const id = nextId.current;
            nextId.current += 1;

            setToasts((current) => [...current, { id, kind, message }]);
            setTimeout(() => dismiss(id), TOAST_DURATION_MS);
        },
        [dismiss],
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <ToastViewport onDismiss={dismiss} toasts={toasts} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context.toast;
}

function ToastViewport({
    onDismiss,
    toasts,
}: {
    onDismiss: (id: number) => void;
    toasts: ToastItem[];
}) {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
            {toasts.map((toast) => {
                const color = KIND_COLOR[toast.kind];

                return (
                    <button
                        className="flex items-center gap-2.5 rounded-[10px] border px-4 py-2.5 shadow-2xl"
                        key={toast.id}
                        onClick={() => onDismiss(toast.id)}
                        style={{
                            animation: 'ktoast .2s ease-out',
                            background: 'var(--color-elev-2)',
                            borderColor: color + '55',
                        }}
                    >
                        <span
                            className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                            style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                        />
                        <span className="text-[13px] text-fg">{toast.message}</span>
                    </button>
                );
            })}

            <style>{`@keyframes ktoast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}
