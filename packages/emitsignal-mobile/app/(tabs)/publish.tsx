import { TOPIC_NAME_MAX_LENGTH } from '@emitsignal/shared/topic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivitySparkline, WCode, WLogo, WTopicAvatar } from '@/components/base-theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type Palette } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export default function PublishScreen() {
    const { palette, styles } = useThemedStyles(createStyles);
    const bottomInset = useTabBarInset();
    const [topic, setTopic] = useState('alerts/prod');
    const [title, setTitle] = useState('Deploy succeeded');
    const [body, setBody] = useState('api-gateway shipped to prod');
    const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [tags, setTags] = useState('deploy,prod');
    const [busy, setBusy] = useState(false);
    const queryClient = useQueryClient();
    const { data: topics = [] } = useQuery({
        queryFn: () => api.listTopics(),
        queryKey: queryKeys.topics(''),
    });

    const handlePublish = async () => {
        if (!topic.trim() || !title.trim()) {
            return;
        }
        setBusy(true);
        try {
            await api.publish(topic.trim(), {
                body: body.trim(),
                priority,
                tags: tags
                    .split(',')
                    .map((topic) => topic.trim())
                    .filter(Boolean),
                title: title.trim(),
            });
            Alert.alert('Published', `→ ${topic}`);
            void queryClient.invalidateQueries({ queryKey: queryKeys.topics('') });
        } catch (error) {
            Alert.alert('Failed', error instanceof Error ? error.message : String(error));
        } finally {
            setBusy(false);
        }
    };

    const curl = `curl -d "${body}" \\
  -H "Content-Type: application/json" \\
  ${api.baseUrl}/topic/${topic}`;

    return (
        <SafeAreaView edges={['top']} style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ paddingBottom: bottomInset }}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <WLogo pulse size={12} />
                        </View>
                        <Text style={styles.title}>Publish</Text>
                        <Text style={styles.subtitle}>
                            {topics.length} owned topic
                            {topics.length === 1 ? '' : 's'}
                        </Text>
                    </View>

                    <SectionLabel>QUICKSTART</SectionLabel>
                    <View style={{ paddingBottom: 16, paddingHorizontal: 20 }}>
                        <WCode language="CURL · ANYWHERE">{curl}</WCode>
                    </View>

                    <SectionLabel>COMPOSE</SectionLabel>
                    <View style={styles.form}>
                        <FieldLabel>TOPIC</FieldLabel>
                        <TextInput
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={TOPIC_NAME_MAX_LENGTH}
                            onChangeText={setTopic}
                            placeholder="deploy/prod"
                            placeholderTextColor={palette.fgDim}
                            style={styles.input}
                            value={topic}
                        />

                        <FieldLabel>TITLE</FieldLabel>
                        <TextInput
                            onChangeText={setTitle}
                            placeholder="Deploy succeeded"
                            placeholderTextColor={palette.fgDim}
                            style={styles.input}
                            value={title}
                        />

                        <FieldLabel>BODY</FieldLabel>
                        <TextInput
                            multiline
                            onChangeText={setBody}
                            placeholder="api-gateway → vercel prod"
                            placeholderTextColor={palette.fgDim}
                            style={[styles.input, styles.textArea]}
                            value={body}
                        />

                        <FieldLabel>PRIORITY</FieldLabel>
                        <View style={styles.prioRow}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <Pressable
                                    key={level}
                                    onPress={() => setPriority(level as 1 | 2 | 3 | 4 | 5)}
                                    style={[
                                        styles.prioBtn,
                                        level === priority && styles.prioBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.prioText,
                                            level === priority && styles.prioTextActive,
                                        ]}
                                    >
                                        {level}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <FieldLabel>TAGS</FieldLabel>
                        <TextInput
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setTags}
                            placeholder="comma,separated,tags"
                            placeholderTextColor={palette.fgDim}
                            style={styles.input}
                            value={tags}
                        />

                        <Pressable
                            disabled={busy}
                            onPress={handlePublish}
                            style={[styles.publishBtn, busy && { opacity: 0.6 }]}
                        >
                            <Text style={styles.publishText}>
                                {busy ? 'publishing…' : `publish → ${topic}`}
                            </Text>
                            <IconSymbol color={palette.bg} name="arrow.right" size={14} />
                        </Pressable>
                    </View>

                    {topics.length > 0 && (
                        <>
                            <SectionLabel>OWNED TOPICS</SectionLabel>

                            {topics.map((topic) => {
                                const seed = topic.id.charCodeAt(topic.id.length - 1);
                                const chart = Array.from(
                                    { length: 12 },
                                    (_, index) => Math.abs(Math.sin((seed + index) * 0.5)) * 5,
                                );
                                return (
                                    <View key={topic.id} style={styles.topicRow}>
                                        <WTopicAvatar name={topic.name} rounded={6} size={32} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.topicName}>{topic.name}</Text>
                                            <Text style={styles.topicMeta}>{topic.accessMode}</Text>
                                        </View>
                                        <View style={{ width: 70 }}>
                                            <ActivitySparkline
                                                color={palette.violet}
                                                data={chart}
                                                height={20}
                                                showTotal={false}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function FieldLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return <Text style={styles.fieldLabel}>{children}</Text>;
}

function SectionLabel({ children }: { children: string }) {
    const { styles } = useThemedStyles(createStyles);
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const createStyles = (palette: Palette) =>
    StyleSheet.create({
        fieldLabel: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            letterSpacing: 1.2,
            marginBottom: 6,
            marginTop: 14,
        },
        form: { paddingHorizontal: 20 },
        header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: 12 },
        headerTop: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
        input: {
            backgroundColor: palette.bgElev,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            color: palette.fg,
            fontFamily: Fonts.mono,
            fontSize: 13,
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        prioBtn: {
            alignItems: 'center',
            backgroundColor: palette.bgChip,
            borderColor: palette.bgLine,
            borderRadius: 8,
            borderWidth: StyleSheet.hairlineWidth,
            height: 40,
            justifyContent: 'center',
            width: 40,
        },
        prioBtnActive: {
            backgroundColor: palette.violetBg,
            borderColor: palette.violet,
        },
        prioRow: { flexDirection: 'row', gap: 6 },
        prioText: { color: palette.fgDim, fontFamily: Fonts.mono, fontWeight: '600' },
        prioTextActive: { color: palette.violet },
        publishBtn: {
            alignItems: 'center',
            backgroundColor: palette.violet,
            borderRadius: 10,
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
            marginTop: 24,
            paddingVertical: 14,
        },
        publishText: {
            color: palette.bg,
            fontFamily: Fonts.mono,
            fontSize: 14,
            fontWeight: '600',
        },
        root: { backgroundColor: palette.bg, flex: 1 },
        sectionLabelLine: {
            backgroundColor: palette.bgLine,
            flex: 1,
            height: 1,
            marginLeft: 10,
        },
        sectionLabelRow: {
            alignItems: 'center',
            flexDirection: 'row',
            paddingBottom: 6,
            paddingHorizontal: 20,
            paddingTop: 14,
        },
        sectionLabelText: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 1.5,
        },
        subtitle: {
            color: palette.fgMuted,
            fontFamily: Fonts.mono,
            fontSize: 12,
            marginTop: 4,
        },
        textArea: { minHeight: 80, textAlignVertical: 'top' },
        title: {
            color: palette.fg,
            fontSize: 28,
            fontWeight: '600',
            letterSpacing: -0.5,
        },
        topicMeta: {
            color: palette.fgDim,
            fontFamily: Fonts.mono,
            fontSize: 10.5,
            marginTop: 2,
        },
        topicName: { color: palette.fg, fontFamily: Fonts.mono, fontSize: 12.5 },
        topicRow: {
            alignItems: 'center',
            borderBottomColor: palette.bgLine,
            borderBottomWidth: StyleSheet.hairlineWidth,
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 12,
        },
    });
