export function formatExpiry(value: Date | null | number | string): {
    expired: boolean;
    text: string;
} {
    if (value === null) {
        return { expired: false, text: 'Never' };
    }

    const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
    const diff = timestamp - Date.now();

    if (diff <= 0) {
        return { expired: true, text: 'Expired' };
    }

    const days = Math.ceil(diff / 86_400_000);

    if (days <= 1) {
        return { expired: false, text: 'Today' };
    }

    if (days < 7) {
        return { expired: false, text: `${days}d` };
    }

    if (days < 30) {
        return { expired: false, text: `${Math.round(days / 7)}w` };
    }

    if (days < 365) {
        return { expired: false, text: `${Math.round(days / 30)}mo` };
    }

    return { expired: false, text: `${Math.round(days / 365)}y` };
}

export function formatSize(bytes: number): string {
    if (!bytes || bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(value: Date | number | string): string {
    const timestamp = typeof value === 'number' ? value : new Date(value).getTime();

    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return new Date(timestamp).toLocaleDateString();
}
