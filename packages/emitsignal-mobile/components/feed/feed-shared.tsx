import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { Message } from '@/lib/api';

import { WDot } from '@/components/base-theme';
import { type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

// ─── item type definitions ────────────────────────────────────────────────────

export type ComfyItem = { kind: 'label'; text: string } | { kind: 'row'; message: Message };

export type PriorityItem =
    | { kind: 'priority-header'; label: string; level: 1 | 2 | 3 | 4 | 5 }
    | { kind: 'row'; message: Message };

export type TimelineItem =
    | { isLast: boolean; kind: 'row'; message: Message }
    | { kind: 'date'; text: string };

// ─── utilities ────────────────────────────────────────────────────────────────

export function dayLabel(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    if (d >= todayStart) {
        return 'Today';
    }

    if (d >= yesterdayStart) {
        return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── shared components ────────────────────────────────────────────────────────

export function EmptyFeed({
    filter,
    loading,
    message,
}: {
    filter: string;
    loading?: boolean;
    message?: string;
}) {
    const { palette, styles } = useThemedStyles(createStyles);

    if (loading) {
        return (
            <View style={styles.empty}>
                <ActivityIndicator color={palette.violet} />
            </View>
        );
    }

    return (
        <View style={styles.empty}>
            <WDot level={2} size={10} />
            <Text style={styles.emptyTitle}>
                {message
                    ? 'Could not load feed'
                    : filter !== 'all'
                      ? `No ${filter} messages`
                      : 'No messages yet'}
            </Text>
            <Text style={styles.emptyBody}>
                {message
                    ? message
                    : filter !== 'all'
                      ? 'Try a different filter'
                      : 'Subscribe to a channel to start receiving notifications.'}
            </Text>
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        empty: {
            alignItems: 'center',
            flex: 1,
            gap: 10,
            justifyContent: 'center',
            padding: 40,
        },
        emptyBody: {
            color: palette.fgMuted,
            fontSize: 13,
            textAlign: 'center',
        },
        emptyTitle: {
            color: palette.fg,
            fontSize: 16,
            fontWeight: '600',
            marginTop: 6,
        },
    });
