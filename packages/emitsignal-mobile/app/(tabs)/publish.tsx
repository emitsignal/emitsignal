import { useEffect, useState } from 'react';
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
import { Fonts, W } from '@/constants/theme';
import { api, type Topic } from '@/lib/api';

export default function PublishScreen() {
    const [topic, setTopic] = useState('alerts/prod');
    const [title, setTitle] = useState('Deploy succeeded');
    const [body, setBody] = useState('api-gateway shipped to prod');
    const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [tags, setTags] = useState('deploy,prod');
    const [topics, setTopics] = useState<Topic[]>([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.listTopics()
            .then(setTopics)
            .catch(() => {});
    }, []);

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
            const updated = await api.listTopics();
            setTopics(updated);
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
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
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
                            onChangeText={setTopic}
                            placeholder="deploy/prod"
                            placeholderTextColor={W.fgDim}
                            style={styles.input}
                            value={topic}
                        />

                        <FieldLabel>TITLE</FieldLabel>
                        <TextInput
                            onChangeText={setTitle}
                            placeholder="Deploy succeeded"
                            placeholderTextColor={W.fgDim}
                            style={styles.input}
                            value={title}
                        />

                        <FieldLabel>BODY</FieldLabel>
                        <TextInput
                            multiline
                            onChangeText={setBody}
                            placeholder="api-gateway → vercel prod"
                            placeholderTextColor={W.fgDim}
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
                            placeholderTextColor={W.fgDim}
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
                            <IconSymbol color={W.bg} name="arrow.right" size={14} />
                        </Pressable>
                    </View>

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
                                    <Text style={styles.topicMeta}>
                                        {topic.isPublic ? 'public' : 'private'}
                                    </Text>
                                </View>
                                <View style={{ width: 70 }}>
                                    <ActivitySparkline
                                        color={W.violet}
                                        data={chart}
                                        height={20}
                                        showTotal={false}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function FieldLabel({ children }: { children: string }) {
    return <Text style={styles.fieldLabel}>{children}</Text>;
}

function SectionLabel({ children }: { children: string }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelText}>{children}</Text>
            <View style={styles.sectionLabelLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    fieldLabel: {
        color: W.fgDim,
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
        backgroundColor: W.bgElev,
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        color: W.fg,
        fontFamily: Fonts.mono,
        fontSize: 13,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    prioBtn: {
        alignItems: 'center',
        backgroundColor: W.bgChip,
        borderColor: W.bgLine,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    prioBtnActive: {
        backgroundColor: W.violetBg,
        borderColor: W.violet,
    },
    prioRow: { flexDirection: 'row', gap: 6 },
    prioText: { color: W.fgDim, fontFamily: Fonts.mono, fontWeight: '600' },
    prioTextActive: { color: W.violet },
    publishBtn: {
        alignItems: 'center',
        backgroundColor: W.violet,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        marginTop: 24,
        paddingVertical: 14,
    },
    publishText: {
        color: W.bg,
        fontFamily: Fonts.mono,
        fontSize: 14,
        fontWeight: '600',
    },
    root: { backgroundColor: W.bg, flex: 1 },
    sectionLabelLine: {
        backgroundColor: W.bgLine,
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
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 1.5,
    },
    subtitle: {
        color: W.fgMuted,
        fontFamily: Fonts.mono,
        fontSize: 12,
        marginTop: 4,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    title: {
        color: W.fg,
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    topicMeta: {
        color: W.fgDim,
        fontFamily: Fonts.mono,
        fontSize: 10.5,
        marginTop: 2,
    },
    topicName: { color: W.fg, fontFamily: Fonts.mono, fontSize: 12.5 },
    topicRow: {
        alignItems: 'center',
        borderBottomColor: W.bgLine,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
});
