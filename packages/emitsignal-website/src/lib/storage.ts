const DEVICE_ID_KEY = '@emitsignal/device_id';

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
