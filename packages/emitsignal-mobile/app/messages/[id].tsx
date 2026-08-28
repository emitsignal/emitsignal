import { buildCurlExample } from '@emitsignal/shared/publish-example';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttachmentPreview } from '@/components/attachment-preview';
import { WChip, WCode, WDot } from '@/components/base-theme';
import { MessageActionsMenu } from '@/components/message-actions-menu';
import { MessageMedia } from '@/components/message-media';
import { ScreenHeader } from '@/components/screen-header';
import { SkeletonMessageDetail } from '@/components/skeleton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette, PriorityColors } from '@/constants/theme';
import { useDebugSections } from '@/ctx/debug-sections';
import { useDevice } from '@/ctx/device';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api, PUBLISH_BASE_URL } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { openExternalUrl } from '@/lib/open-external';
import { queryKeys } from '@/lib/query-client';

export default function MessageDetailScreen() {
    const { palette, styles } = useThemedStyles(createStyles);
    const [acknowledged, setAcknowledged] = useState(false);
    const [ackResult, setAckResult] = useState<null | number>(null);
    const { deviceId } = useDevice();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { sections } = useDebugSections();

    const { data: message, isLoading } = useQuery({
        enabled: Boolean(id),
        queryFn: () => api.getMessage(id),
        queryKey: queryKeys.message(id),
    });

    const ackCount = ackResult ?? message?.acknowledgmentCount ?? 0;

    const handleAcknowledge = async () => {
        if (acknowledged || !deviceId) {
            return;
        }

        try {
            const result = await api.acknowledgeMessage(id, deviceId);

            setAcknowledged(true);
            setAckResult(result.count);
        } catch (error) {
            console.warn('Acknowledge failed:', error);
        }
    };

    const handleView = async (url: string) => {
        // Publisher-controlled action URL — open only through the scheme guard.
        await openExternalUrl(url);
    };

    if (!message) {
        return (
            <SafeAreaView edges={['top']} style={styles.root}>
                <ScreenHeader altName="" title="message" />

                {isLoading ? (
                    <SkeletonMessageDetail />
                ) : (
                    <Text style={styles.loading}>message unavailable</Text>
                )}
            </SafeAreaView>
        );
    }

    const priority = message.priority;

    const priorityLabel =
        priority >= 5 ? 'max' : priority === 4 ? 'high' : priority === 3 ? 'default' : 'low';

    const curlCommand = buildCurlExample({
        baseUrl: PUBLISH_BASE_URL,
        message: {
            actions: message.actions,
            body: message.body,
            priority: message.priority,
            tags: message.tags,
            title: message.title,
        },
        topicName: message.topicName ?? message.topicId,
    });

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <ScreenHeader
                altName={message.topicName}
                right={<MessageActionsMenu messageId={message.id} title={message.title} />}
                subtitle={relativeTime(message.createdAt)}
                title={message.topicName ?? 'message'}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.hero}>
                    <View style={styles.prioRow}>
                        <WDot level={priority} size={8} />
                        <Text style={[styles.priorityText, { color: PriorityColors[priority] }]}>
                            priority {priority} · {priorityLabel}
                        </Text>
                    </View>

                    <Text style={styles.title}>{message.title}</Text>
                    <Text style={styles.body}>{message.body}</Text>

                    <View style={styles.tagsRow}>
                        {message.tags.map((tag, index) => (
                            <WChip key={index}>{`#${tag}`}</WChip>
                        ))}
                    </View>

                    <MessageMedia
                        bannerImage={message.bannerImage}
                        inlineAttachments={message.inlineAttachments}
                        inlineImages={message.inlineImages}
                    />

                    {message.attachments && message.attachments.length > 0 && (
                        <View style={styles.attachments}>
                            {message.attachments.map((attachment, index) => {
                                const isImg = attachment.mimeType.startsWith('image/');

                                return (
                                    <AttachmentPreview
                                        attachment={attachment}
                                        key={index}
                                        onPress={
                                            isImg
                                                ? () =>
                                                      router.push({
                                                          params: {
                                                              filename: attachment.filename,
                                                              size: String(attachment.size),
                                                              url: attachment.url,
                                                          },
                                                          pathname: '/image-viewer',
                                                      })
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </View>
                    )}

                    {message.actions.length > 0 && (
                        <View style={styles.actions}>
                            {message.actions.map((action, i) => {
                                if (action.type === 'acknowledge') {
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={handleAcknowledge}
                                            style={[styles.actionBtn, styles.actionPrimary]}
                                        >
                                            <IconSymbol
                                                color={palette.bg}
                                                name="checkmark.circle.fill"
                                                size={14}
                                            />
                                            <Text style={styles.actionPrimaryText}>
                                                {action.label ?? 'Acknowledge'}
                                                {ackCount > 0 ? ` (${ackCount})` : ''}
                                            </Text>
                                        </Pressable>
                                    );
                                }

                                if (action.type === 'view') {
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={() => action.url && handleView(action.url)}
                                            style={styles.actionBtn}
                                        >
                                            <IconSymbol color={palette.fg} name="globe" size={14} />
                                            <Text style={styles.actionText}>
                                                {action.label ?? 'View'}
                                            </Text>
                                        </Pressable>
                                    );
                                }

                                return null;
                            })}
                        </View>
                    )}
                </View>

                {sections.showPayload && (
                    <>
                        <SectionHead>payload</SectionHead>

                        <View style={styles.codeWrap}>
                            <WCode language="JSON">
                                {JSON.stringify(
                                    {
                                        acknowledgmentCount: message.acknowledgmentCount,
                                        actions: message.actions,
                                        bannerImage: message.bannerImage,
                                        body: message.body,
                                        createdAt: new Date(message.createdAt).toISOString(),
                                        inlineAttachments: message.inlineAttachments,
                                        inlineImages: message.inlineImages,
                                        priority: message.priority,
                                        tags: message.tags,
                                        title: message.title,
                                        topic: message.topicName,
                                    },
                                    null,
                                    2,
                                )}
                            </WCode>
                        </View>
                    </>
                )}

                {sections.showCurl ? (
                    <>
                        <SectionHead>reproduce · curl</SectionHead>
                        <View style={styles.codeWrap}>
                            <WCode language="BASH">{curlCommand}</WCode>
                        </View>
                    </>
                ) : null}

                {sections.showDelivery ? (
                    <>
                        <SectionHead>delivery</SectionHead>
                        {[
                            { e: 'received', ok: true, t: formatTime(message.createdAt) },
                            {
                                e: `routed → ${message.topicName}`,
                                ok: true,
                                t: formatTime(message.createdAt),
                            },
                            {
                                e: 'push → fcm',
                                ok: true,
                                t: formatTime(message.createdAt + 1000),
                            },
                            {
                                e: 'delivered · this device',
                                ok: true,
                                t: formatTime(message.createdAt + 2000),
                            },
                        ].map((s, i) => (
                            <View key={i} style={styles.timelineRow}>
                                <Text style={styles.timelineTime}>{s.t}</Text>
                                <Text
                                    style={[
                                        styles.timelineDot,
                                        { color: s.ok ? palette.green : palette.red },
                                    ]}
                                >
                                    {s.ok ? '✓' : '✗'}
                                </Text>
                                <Text style={styles.timelineText}>{s.e}</Text>
                            </View>
                        ))}
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pad(n: number) {
    return n.toString().padStart(2, '0');
}
function SectionHead({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return <Text style={styles.sectionHead}>{children}</Text>;
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        actionBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            flex: 1,
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            paddingVertical: 10,
        },
        actionPrimary: { backgroundColor: palette.violet, borderColor: palette.violet },
        actionPrimaryText: { color: palette.bg, fontSize: 12.5, fontWeight: '600' },
        actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
        actionText: {
            color: palette.fg,
            fontSize: 12.5,
            fontWeight: '600',
        },
        attachments: {
            gap: 8,
            marginTop: 14,
        },
        body: {
            color: palette.fgMuted,
            fontSize: 14,
            lineHeight: 22,
            marginTop: 10,
        },
        codeWrap: { paddingHorizontal: 20 },
        hero: {
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingBottom: 18,
            paddingHorizontal: 20,
            paddingTop: 20,
        },
        loading: {
            color: palette.fgMuted,
            flex: 1,
            fontFamily: Fonts.mono,
            paddingTop: 40,
            textAlign: 'center',
        },
        priorityText: {
            fontFamily: Fonts.mono,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
        },
        prioRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
        root: { backgroundColor: palette.bg, flex: 1 },
        sectionHead: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 1.5,
            marginBottom: 8,
            marginTop: 18,
            paddingHorizontal: 20,
        },
        tagsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 14,
        },
        timelineDot: { fontFamily: Fonts.mono, fontSize: 11, width: 12 },
        timelineRow: {
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 20,
            paddingVertical: 6,
        },
        timelineText: {
            color: palette.fgMuted,
            flex: 1,
            fontFamily: Fonts.mono,
            fontSize: 11,
        },
        timelineTime: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 11,
            width: 64,
        },
        title: {
            color: palette.fg,
            fontSize: 22,
            fontWeight: '600',
            letterSpacing: -0.6,
            lineHeight: 28,
            marginTop: 12,
        },
    });
