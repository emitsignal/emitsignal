import type { Message } from '@emitsignal/shared';
import type { Key } from 'ink';

import { hashTopicLevel, priorityHex } from '@emitsignal/shared';
import { Box, render, Text, useApp, useInput, useWindowSize } from 'ink';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { openUrl } from '../browser.ts';
import { formatTime } from '../output.ts';
import { streamSse } from '../sse.ts';

// ── Types ─────────────────────────────────────────────────────────

export interface TuiProps {
    baseUrl: string;
    consoleUrl: string;
    filter?: string;
    focusChannel?: string;
    subscriptions: { topic: { name: string } }[];
    token: string;
}

type FocusPane = 'channels' | 'detail' | 'stream';

type Mode = 'command' | 'help' | 'normal' | 'search';

// ── Helpers ───────────────────────────────────────────────────────

function channelColor(name: string): string {
    return priorityHex(hashTopicLevel(name));
}

// ── SparkBar ──────────────────────────────────────────────────────
// Two text elements (dim violet + red) — no raw ANSI sequences.

const SPARK_VALS = [30, 32, 28, 35, 40, 38, 42, 50, 55, 65, 78, 88, 92, 94, 88, 75] as const;
const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const;
const SPARK_MAX = 94;
const sparkChars = SPARK_VALS.map(
    (v) => SPARK_CHARS[Math.min(7, Math.round((v / SPARK_MAX) * 7))] ?? '▁',
);
const SPARK_DIM = sparkChars.slice(0, 11).join(''); // faded violet portion
const SPARK_RED = sparkChars.slice(11).join(''); // red "high" portion

function SparkBar() {
    return (
        <Box flexDirection="row">
            <Text color="#5a4487">{SPARK_DIM}</Text>
            <Text color="#f87171">{SPARK_RED}</Text>
        </Box>
    );
}

// ── HelpOverlay ───────────────────────────────────────────────────

const HELP_ROWS = [
    ['j / k', 'navigate stream up / down'],
    ['g / G', 'jump to top / bottom'],
    ['c', 'focus channel list'],
    ['↵', 'focus detail pane'],
    ['Esc', 'back to stream pane'],
    ['a', 'acknowledge event'],
    ['o', 'open selected event in console'],
    ['/', 'incremental search'],
    [':', 'command mode  (filter <expr>, clear, quit)'],
    ['p', 'cycle priority filter'],
    ['?', 'help'],
    ['q', 'quit'],
] as const;

export async function launchTui(props: TuiProps): Promise<void> {
    const instance = render(<App {...props} />, { alternateScreen: true, exitOnCtrlC: true });

    await instance.waitUntilExit();
}

// ── App ─────────────────────────────────────────────────────────────

function App({
    baseUrl,
    consoleUrl,
    filter: initialFilter,
    focusChannel,
    subscriptions,
    token,
}: TuiProps) {
    const { exit } = useApp();
    const { rows } = useWindowSize();
    const [events, setEvents] = useState<Message[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [selectedChannelIdx, setSelectedChannelIdx] = useState(0);
    const [focusPane, setFocusPane] = useState<FocusPane>('stream');
    const [mode, setMode] = useState<Mode>('normal');
    const [cmdInput, setCmdInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChannelFilter, setActiveChannelFilter] = useState<null | string>(
        focusChannel ?? null,
    );
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);

    // Unread count per channel, derived from live events
    const channelUnread = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const e of events) {
            const n = e.topicName ?? '';
            counts[n] = (counts[n] ?? 0) + 1;
        }
        return counts;
    }, [events]);

    const channels = subscriptions.map((s) => ({
        name: s.topic.name,
        unread: channelUnread[s.topic.name] ?? 0,
    }));

    // Filtered view: channel filter + search query
    const filteredEvents = useMemo(() => {
        return events.filter((e) => {
            if (activeChannelFilter && e.topicName !== activeChannelFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !e.title.toLowerCase().includes(q) &&
                    !e.body.toLowerCase().includes(q) &&
                    !(e.topicName ?? '').toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });
    }, [events, activeChannelFilter, searchQuery]);

    // SSE connection with auto-reconnect
    useEffect(() => {
        const controller = new AbortController();
        async function connect() {
            const topics = subscriptions.map((s) => s.topic.name);
            const qs =
                topics.length > 0 ? `?topics=${topics.map(encodeURIComponent).join(',')}` : '';
            try {
                await streamSse<Message>(`${baseUrl}/listen${qs}`, {
                    onEvent: (message) =>
                        setEvents((prevEvents) => [message, ...prevEvents].slice(0, 100)),
                    signal: controller.signal,
                    token,
                });
            } catch (e) {
                if ((e as Error).name !== 'AbortError') setTimeout(connect, 2000);
            }
        }
        connect();
        return () => controller.abort();
    }, [baseUrl, token]);

    // Fetch current user name + email
    useEffect(() => {
        fetch(`${baseUrl}/api/auth/get-session`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d: unknown) => {
                const sessionUser = (d as { user?: { email?: string; name?: string } } | null)
                    ?.user;
                if (sessionUser?.email && sessionUser.name) {
                    setUser({ email: sessionUser.email, name: sessionUser.name });
                }
            })
            .catch(() => {});
    }, [baseUrl, token]);

    // Keep selectedIdx in bounds
    useEffect(() => {
        if (filteredEvents.length > 0 && selectedIdx >= filteredEvents.length) {
            setSelectedIdx(filteredEvents.length - 1);
        }
    }, [filteredEvents.length, selectedIdx]);

    // Command execution
    const executeCommand = useCallback(
        (input: string) => {
            const parts = input.trim().split(/\s+/);
            const cmd = parts[0]?.toLowerCase() ?? '';
            switch (cmd) {
                case 'clear':
                    setSearchQuery('');
                    setActiveChannelFilter(null);
                    break;
                case 'filter':
                    if (parts[1]) setSearchQuery(parts.slice(1).join(' '));
                    break;
                case 'q':
                case 'quit':
                    exit();
                    break;
                case 'sub':
                case 'subscribe':
                    // Pass-through note: actual subscribe needs API call
                    break;
            }
        },
        [exit],
    );

    const openSelectedInConsole = useCallback(() => {
        const event = filteredEvents[selectedIdx];
        if (event) openUrl(`${consoleUrl}/app/inbox/${event.id}`);
    }, [filteredEvents, selectedIdx, consoleUrl]);

    // Keyboard handler — Ink surfaces printable characters via `input` and
    // special keys via boolean flags on `key`, unlike opentui's unified
    // `key.name` string.
    const handleKey = useCallback(
        (input: string, key: Key) => {
            // Help overlay: any key closes
            if (mode === 'help') {
                setMode('normal');
                return;
            }

            // Command / search input capture
            if (mode === 'command' || mode === 'search') {
                if (key.escape) {
                    setMode('normal');
                    setCmdInput('');
                } else if (key.return) {
                    if (mode === 'command') {
                        executeCommand(cmdInput);
                    } else {
                        setSearchQuery(cmdInput);
                        setSelectedIdx(0);
                    }
                    setMode('normal');
                    setCmdInput('');
                } else if (key.backspace || key.delete) {
                    setCmdInput((prev) => prev.slice(0, -1));
                } else if (!key.ctrl && !key.meta && input.length > 0) {
                    setCmdInput((prev) => prev + input);
                }
                return;
            }

            // Global shortcuts (work in any pane)
            if (input === 'q') {
                exit();
                return;
            }
            if (input === '?') {
                setMode('help');
                return;
            }
            if (input === ':') {
                setMode('command');
                setCmdInput('');
                return;
            }
            if (input === '/') {
                setMode('search');
                setCmdInput(searchQuery);
                return;
            }

            // Stream pane
            if (focusPane === 'stream') {
                if (input === 'j' || key.downArrow)
                    setSelectedIdx((i) => Math.min(i + 1, Math.max(0, filteredEvents.length - 1)));
                if (input === 'k' || key.upArrow) setSelectedIdx((i) => Math.max(i - 1, 0));
                if (input === 'G') setSelectedIdx(Math.max(0, filteredEvents.length - 1));
                if (input === 'g') setSelectedIdx(0);
                if (input === 'c') setFocusPane('channels');
                if (input === 'o') openSelectedInConsole();
                if (key.return) setFocusPane('detail');
                return;
            }

            // Channel pane
            if (focusPane === 'channels') {
                if (input === 'j' || key.downArrow)
                    setSelectedChannelIdx((i) => Math.min(i + 1, channels.length - 1));
                if (input === 'k' || key.upArrow) setSelectedChannelIdx((i) => Math.max(i - 1, 0));
                if (key.return) {
                    const ch = channels[selectedChannelIdx]?.name ?? null;
                    setActiveChannelFilter(ch);
                    setSelectedIdx(0);
                    setFocusPane('stream');
                }
                if (key.escape) {
                    setActiveChannelFilter(null);
                    setFocusPane('stream');
                }
                return;
            }

            // Detail pane
            if (focusPane === 'detail') {
                if (key.escape) setFocusPane('stream');
                if (input === 'j' || key.downArrow)
                    setSelectedIdx((i) => Math.min(i + 1, Math.max(0, filteredEvents.length - 1)));
                if (input === 'k' || key.upArrow) setSelectedIdx((i) => Math.max(i - 1, 0));
                if (input === 'o') openSelectedInConsole();
            }
        },
        [
            mode,
            focusPane,
            filteredEvents.length,
            channels,
            selectedChannelIdx,
            cmdInput,
            searchQuery,
            executeCommand,
            exit,
            openSelectedInConsole,
        ],
    );

    useInput(handleKey);

    const activeFilter = searchQuery
        ? `search:"${searchQuery}"`
        : activeChannelFilter
          ? `channel:${activeChannelFilter}`
          : (initialFilter ?? 'priority>=1');

    return (
        <Box backgroundColor="#030304" flexDirection="column" height={rows}>
            <TopBar subCount={subscriptions.length} unread={filteredEvents.length} user={user} />

            {mode === 'help' ? (
                <Box alignItems="center" flexGrow={1} justifyContent="center">
                    <HelpOverlay />
                </Box>
            ) : (
                <Box flexDirection="row" flexGrow={1} minHeight={0}>
                    <ChannelList
                        channels={channels}
                        focused={focusPane === 'channels'}
                        selectedChannelIdx={selectedChannelIdx}
                    />
                    <Stream
                        events={filteredEvents}
                        focused={focusPane === 'stream'}
                        selectedIdx={selectedIdx}
                    />
                    <Detail event={filteredEvents[selectedIdx]} focused={focusPane === 'detail'} />
                </Box>
            )}

            <StatusBar
                cmdInput={cmdInput}
                filter={activeFilter}
                mode={mode}
                selectedIdx={selectedIdx}
                total={filteredEvents.length}
            />
        </Box>
    );
}

// ── ChannelList ────────────────────────────────────────────────────

function ChannelList({
    channels,
    focused,
    selectedChannelIdx,
}: {
    channels: { name: string; unread: number }[];
    focused: boolean;
    selectedChannelIdx: number;
}) {
    return (
        <Box
            borderBottom={false}
            borderColor="#232427"
            borderLeft={false}
            borderRight
            borderStyle="single"
            borderTop={false}
            flexDirection="column"
            width={24}
        >
            <Box
                borderBottom
                borderColor="#232427"
                borderLeft={false}
                borderRight={false}
                borderStyle="single"
                borderTop={false}
                paddingLeft={1}
                paddingRight={1}
            >
                <Text color={focused ? '#a78bfa' : '#71717a'}>{'CHANNELS [c]'}</Text>
            </Box>

            {channels.map((ch, i) => {
                const selected = i === selectedChannelIdx;
                const active = focused && selected;
                return (
                    <Box
                        alignItems="center"
                        backgroundColor={active ? '#191a1d' : selected ? '#111113' : undefined}
                        borderBottom={false}
                        // Left accent: bright when the pane is focused, dim while the
                        // selection just persists in the background
                        borderColor={active ? '#a78bfa' : selected ? '#3f3f46' : '#030304'}
                        borderLeft
                        borderRight={false}
                        borderStyle="single"
                        borderTop={false}
                        flexDirection="row"
                        gap={1}
                        key={ch.name}
                        paddingLeft={1}
                        paddingRight={1}
                    >
                        <Text color={channelColor(ch.name)}>{'●'}</Text>
                        <Box flexGrow={1}>
                            <Text
                                color={active ? '#f7f7f8' : selected ? '#d4d4d8' : '#a1a1a6'}
                                wrap="truncate-end"
                            >
                                {ch.name}
                            </Text>
                        </Box>
                        {ch.unread > 0 && <Text color="#a78bfa">{String(ch.unread)}</Text>}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Detail ──────────────────────────────────────────────────────────

function Detail({ event, focused }: { event: Message | undefined; focused: boolean }) {
    return (
        <Box flexDirection="column" width={34}>
            <Box
                borderBottom
                borderColor="#232427"
                borderLeft={false}
                borderRight={false}
                borderStyle="single"
                borderTop={false}
                paddingLeft={1}
                paddingRight={1}
            >
                <Text color={focused ? '#a78bfa' : '#71717a'}>{'DETAIL [↵]'}</Text>
            </Box>

            {!event ? (
                <Box paddingLeft={1} paddingTop={1}>
                    <Text color="#3f3f46">select an event</Text>
                </Box>
            ) : (
                <Box flexDirection="column" paddingLeft={1} paddingRight={1} paddingTop={1}>
                    <Text color={priorityHex(event.priority)}>
                        {`● PRIORITY ${event.priority} · ${event.topicName ?? ''}`}
                    </Text>
                    <Box height={1} />

                    <Text color="#f7f7f8">{event.title}</Text>
                    <Box height={1} />

                    <Text color="#a1a1a6" wrap="wrap">
                        {event.body}
                    </Text>
                    <Box height={1} />

                    <Text color="#71717a">{'METRIC · 5M'}</Text>
                    <SparkBar />

                    <Box height={1} />

                    <Text color="#71717a">ACTIONS</Text>
                    <Box height={1} />

                    <Box flexDirection="row" gap={2}>
                        <Box flexDirection="row">
                            <Text color="#a78bfa">{'[a]'}</Text>
                            <Text color="#a1a1a6">{' ack'}</Text>
                        </Box>
                        <Box flexDirection="row">
                            <Text color="#a78bfa">{'[s]'}</Text>
                            <Text color="#a1a1a6">{' snooze 1h'}</Text>
                        </Box>
                    </Box>

                    <Box flexDirection="row">
                        <Text color="#a78bfa">{'[o]'}</Text>
                        <Text color="#a1a1a6">{' open in console'}</Text>
                    </Box>

                    <Box flexDirection="row">
                        <Text color="#a78bfa">{'[r]'}</Text>
                        <Text color="#a1a1a6">{' reply'}</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

// ── HelpOverlay ───────────────────────────────────────────────────────

function HelpOverlay() {
    return (
        <Box
            backgroundColor="#111113"
            borderColor="#a78bfa"
            borderStyle="round"
            flexDirection="column"
            paddingBottom={1}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            width={56}
        >
            <Text color="#a78bfa">Keybindings</Text>
            <Box height={1} />
            {HELP_ROWS.map(([key, desc]) => (
                <Box flexDirection="row" gap={1} key={key}>
                    <Box width={14}>
                        <Text color="#a78bfa">{key}</Text>
                    </Box>
                    <Text color="#a1a1a6">{desc}</Text>
                </Box>
            ))}
            <Box height={1} />
            <Text color="#3f3f46">press any key to close</Text>
        </Box>
    );
}

// ── StatusBar ────────────────────────────────────────────────────────

function StatusBar({
    cmdInput,
    filter,
    mode,
    selectedIdx,
    total,
}: {
    cmdInput: string;
    filter: string;
    mode: Mode;
    selectedIdx: number;
    total: number;
}) {
    const pos = total > 0 ? `${selectedIdx + 1}/${total}` : '0/0';

    if (mode === 'command' || mode === 'search') {
        const prefix = mode === 'command' ? ':' : '/';
        return (
            <Box
                alignItems="center"
                backgroundColor="#111113"
                borderBottom={false}
                borderColor="#232427"
                borderLeft={false}
                borderRight={false}
                borderStyle="single"
                borderTop
                flexDirection="row"
                paddingLeft={1}
                paddingRight={1}
            >
                <Text color="#a78bfa">{prefix}</Text>
                <Text color="#f7f7f8">{cmdInput}</Text>
                <Text color="#a78bfa">{'█'}</Text>
            </Box>
        );
    }

    return (
        <Box
            alignItems="center"
            backgroundColor="#111113"
            borderBottom={false}
            borderColor="#232427"
            borderLeft={false}
            borderRight={false}
            borderStyle="single"
            borderTop
            flexDirection="row"
            gap={2}
            paddingLeft={1}
            paddingRight={1}
        >
            <Text backgroundColor="#a78bfa" color="#08080a">
                {' NORMAL '}
            </Text>
            <Text color="#71717a">{pos}</Text>
            <Text color="#3f3f46">·</Text>
            <Text color="#71717a">{'filter: '}</Text>
            <Text color="#a78bfa">{filter}</Text>
            <Box flexGrow={1} />
            <Text color="#71717a">{'  : cmd   / search   ? help   q quit'}</Text>
        </Box>
    );
}

// ── Stream ─────────────────────────────────────────────────────────

function Stream({
    events,
    focused,
    selectedIdx,
}: {
    events: Message[];
    focused: boolean;
    selectedIdx: number;
}) {
    return (
        <Box
            borderBottom={false}
            borderColor="#232427"
            borderLeft={false}
            borderRight
            borderStyle="single"
            borderTop={false}
            flexDirection="column"
            flexGrow={1}
        >
            <Box
                alignItems="center"
                borderBottom
                borderColor="#232427"
                borderLeft={false}
                borderRight={false}
                borderStyle="single"
                borderTop={false}
                flexDirection="row"
                paddingLeft={1}
                paddingRight={1}
            >
                <Text color={focused ? '#a78bfa' : '#71717a'}>STREAM</Text>
                <Box flexGrow={1} />
                <Text color="#3f3f46">live · ws</Text>
            </Box>

            {events.map((e, i) => {
                const sel = i === selectedIdx;
                return (
                    <Box
                        alignItems="center"
                        backgroundColor={sel ? '#191a1d' : undefined}
                        borderBottom={false}
                        borderColor={sel ? '#a78bfa' : '#030304'}
                        borderLeft
                        borderRight={false}
                        borderStyle="single"
                        borderTop={false}
                        flexDirection="row"
                        gap={1}
                        key={e.id}
                        paddingLeft={1}
                        paddingRight={1}
                    >
                        <Text color="#3f3f46">{formatTime(e.createdAt)}</Text>
                        <Text color={priorityHex(e.priority)}>{'●'}</Text>
                        <Box width={12}>
                            <Text color={sel ? '#a78bfa' : '#71717a'} wrap="truncate-end">
                                {e.topicName ?? ''}
                            </Text>
                        </Box>
                        <Text color="#3f3f46">{`p${e.priority}`}</Text>
                        <Box flexGrow={1}>
                            <Text color={sel ? '#f7f7f8' : '#a1a1a6'} wrap="truncate-end">
                                {e.title}
                            </Text>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

// ── TopBar ────────────────────────────────────────────────────────

function TopBar({
    subCount,
    unread,
    user,
}: {
    subCount: number;
    unread: number;
    user: { email: string; name: string } | null;
}) {
    return (
        <Box
            alignItems="center"
            borderBottom
            borderColor="#232427"
            borderLeft={false}
            borderRight={false}
            borderStyle="single"
            borderTop={false}
            flexDirection="row"
            gap={2}
            paddingLeft={2}
            paddingRight={2}
        >
            <Text color="#a78bfa">{'● emitsignal'}</Text>
            <Text color="#71717a">{'tui (ink)'}</Text>
            <Text color="#3f3f46">·</Text>
            <Text color="#71717a">{user ? `${user.name} <${user.email}>` : '…'}</Text>
            <Box flexGrow={1} />
            <Text color="#71717a">{`${subCount} subscriptions · ${unread} unread`}</Text>
            <Text color="#4ade80">{'◷ live'}</Text>
        </Box>
    );
}
