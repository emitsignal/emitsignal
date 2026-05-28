const SESSION_KEY = '@emitsignal/session';
const DEVICE_ID_KEY = '@emitsignal/device_id';

interface SessionUser {
    email: string;
    id: string;
    name: null | string;
}

interface StoredSession {
    token: string;
    user: SessionUser;
}

export function getDeviceId(): string {
    if (typeof window === 'undefined') {
        return 'server';
    }

    const existing = localStorage.getItem(DEVICE_ID_KEY);

    if (existing) {
        return existing;
    }

    const deviceId = crypto.randomUUID();

    localStorage.setItem(DEVICE_ID_KEY, deviceId);

    return deviceId;
}

export function getSession(): null | StoredSession {
    if (typeof window === 'undefined') {
        return null;
    }

    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredSession;
    } catch {
        return null;
    }
}

export function removeSession(): void {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = 'emitsignal_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

export function setSession(token: string, user: SessionUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
    document.cookie = 'emitsignal_auth=1; path=/; SameSite=Lax; Max-Age=2592000';
}
