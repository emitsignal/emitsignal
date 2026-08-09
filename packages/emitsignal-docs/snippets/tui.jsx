export const CliTuiDemo = () => (
    <div style={{ margin: '16px 0' }}>
        <div
            style={{
                background: '#030304',
                border: '1px solid #232427',
                borderRadius: 11,
                boxShadow: '0 18px 50px -24px rgba(0,0,0,0.7)',
                fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                overflow: 'hidden',
            }}
        >
            {/* macOS title bar */}
            <div
                style={{
                    height: 34,
                    background: '#111113',
                    borderBottom: '1px solid #232427',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: 7,
                }}
            >
                <span
                    style={{
                        width: 11,
                        height: 11,
                        borderRadius: 99,
                        background: '#ff5f57',
                        display: 'inline-block',
                    }}
                />
                <span
                    style={{
                        width: 11,
                        height: 11,
                        borderRadius: 99,
                        background: '#febc2e',
                        display: 'inline-block',
                    }}
                />
                <span
                    style={{
                        width: 11,
                        height: 11,
                        borderRadius: 99,
                        background: '#28c840',
                        display: 'inline-block',
                    }}
                />
                <span
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 11.5,
                        color: '#71717a',
                        marginLeft: -54,
                    }}
                >
                    emitsignal tui — zsh
                </span>
            </div>

            {/* TUI body */}
            <div
                style={{
                    height: 432,
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: 11.5,
                    lineHeight: 1.5,
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        padding: '7px 14px',
                        borderBottom: '1px solid #232427',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <span style={{ color: '#a78bfa' }}>● emitsignal</span>
                    <span style={{ color: '#71717a' }}>tui</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span style={{ color: '#71717a' }}>alex@acme.io</span>
                    <span style={{ marginLeft: 'auto', color: '#71717a' }}>
                        7 subscriptions · 7 unread
                    </span>
                    <span style={{ color: '#4ade80' }}>◷ live</span>
                </div>

                {/* Three panes */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflowX: 'auto' }}>
                    {/* Channels pane */}
                    <div
                        style={{
                            width: 194,
                            flexShrink: 0,
                            borderRight: '1px solid #232427',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ padding: '7px 12px 6px', borderBottom: '1px solid #232427' }}>
                            <span style={{ color: '#71717a', letterSpacing: 1.5, fontSize: 10.5 }}>
                                CHANNELS [c]
                            </span>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#fbbf24',
                                        boxShadow: '0 0 5px #fbbf2499',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    deploy/prod
                                </span>
                                <span style={{ color: '#a78bfa' }}>2</span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    background: '#191a1d',
                                    color: '#f7f7f8',
                                    borderLeft: '2px solid #a78bfa',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#f87171',
                                        boxShadow: '0 0 5px #f8717199',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    alerts/prod
                                </span>
                                <span style={{ color: '#a78bfa' }}>1</span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#c4b5fd',
                                        boxShadow: '0 0 5px #c4b5fd99',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    ci/web
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#a78bfa',
                                        boxShadow: '0 0 5px #a78bfa99',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    github/core
                                </span>
                                <span style={{ color: '#a78bfa' }}>1</span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#c4b5fd',
                                        boxShadow: '0 0 5px #c4b5fd99',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    cron/backup
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#f87171',
                                        boxShadow: '0 0 5px #f8717199',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    errors/web
                                </span>
                                <span style={{ color: '#a78bfa' }}>3</span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 12px',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: '#c4b5fd',
                                        boxShadow: '0 0 5px #c4b5fd99',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    stripe/pay
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stream pane */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 340,
                            borderRight: '1px solid #232427',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                padding: '7px 12px 6px',
                                borderBottom: '1px solid #232427',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ color: '#71717a', letterSpacing: 1.5, fontSize: 10.5 }}>
                                STREAM
                            </span>
                            <span style={{ marginLeft: 'auto', color: '#3f3f46', fontSize: 10.5 }}>
                                live · ws
                            </span>
                        </div>
                        <div style={{ padding: '4px 0', overflow: 'hidden' }}>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    background: '#191a1d',
                                    color: '#f7f7f8',
                                    borderLeft: '2px solid #a78bfa',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:52:14
                                </span>
                                <span style={{ color: '#f87171', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#a78bfa',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    alerts/prod
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p5</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    High memory on api-02 — mem.used &gt; 92%
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:52:01
                                </span>
                                <span style={{ color: '#a78bfa', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#71717a',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    deploy/prod
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p4</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Deploy succeeded · api-gateway → v2.14.3
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:51:28
                                </span>
                                <span style={{ color: '#4ade80', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#71717a',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    ci/web
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p3</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Build passed · feat/oauth-pkce (247 tests)
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:50:55
                                </span>
                                <span style={{ color: '#67e8f9', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#71717a',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    github/core
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p2</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    PR #482 reviewed by maya — approved
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:49:02
                                </span>
                                <span style={{ color: '#fbbf24', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#71717a',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    cron/backup
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p3</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    nightly-backup.sh ✓ (14.2 GB → s3)
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 14px',
                                    display: 'flex',
                                    gap: 9,
                                    color: '#a1a1a6',
                                    borderLeft: '2px solid transparent',
                                }}
                            >
                                <span style={{ color: '#3f3f46', width: 54, flexShrink: 0 }}>
                                    21:43:21
                                </span>
                                <span style={{ color: '#f87171', flexShrink: 0 }}>●</span>
                                <span
                                    style={{
                                        color: '#71717a',
                                        width: 92,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    errors/web
                                </span>
                                <span style={{ color: '#3f3f46', flexShrink: 0 }}>p5</span>
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    TypeError spike · 34 events in 2m
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detail pane */}
                    <div
                        style={{
                            width: 270,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ padding: '7px 12px 6px', borderBottom: '1px solid #232427' }}>
                            <span style={{ color: '#71717a', letterSpacing: 1.5, fontSize: 10.5 }}>
                                DETAIL [↵]
                            </span>
                        </div>
                        <div style={{ padding: '8px 14px' }}>
                            <div style={{ color: '#f87171', marginBottom: 4 }}>
                                ● PRIORITY 5 · alerts/prod
                            </div>
                            <div style={{ color: '#f7f7f8', fontSize: 13, marginBottom: 8 }}>
                                High memory on api-02
                            </div>
                            <div style={{ color: '#a1a1a6', marginBottom: 12, lineHeight: 1.6 }}>
                                mem.used &gt; 92% for 5m
                                <br />
                                host i-0a3f2b · us-east-1
                            </div>
                            <div
                                style={{
                                    color: '#71717a',
                                    marginBottom: 5,
                                    fontSize: 10.5,
                                    letterSpacing: 1.2,
                                }}
                            >
                                METRIC · 5M
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 2,
                                    height: 38,
                                    marginBottom: 12,
                                }}
                            >
                                {[
                                    30, 32, 28, 35, 40, 38, 42, 50, 55, 65, 78, 88, 92, 94, 88, 75,
                                ].map((v, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            background: i >= 11 ? '#f87171' : '#a78bfa',
                                            opacity: i >= 11 ? 1 : 0.5,
                                            height: `${v}%`,
                                            borderRadius: 1,
                                        }}
                                    />
                                ))}
                            </div>
                            <div
                                style={{
                                    color: '#71717a',
                                    marginBottom: 5,
                                    fontSize: 10.5,
                                    letterSpacing: 1.2,
                                }}
                            >
                                ACTIONS
                            </div>
                            <div style={{ color: '#a1a1a6', marginBottom: 2 }}>
                                <span style={{ color: '#a78bfa' }}>[a]</span>
                                {' ack   '}
                                <span style={{ color: '#a78bfa' }}>[s]</span>
                                {' snooze 1h'}
                            </div>
                            <div style={{ color: '#a1a1a6', marginBottom: 2 }}>
                                <span style={{ color: '#a78bfa' }}>[o]</span>
                                {' open in console'}
                            </div>
                            <div style={{ color: '#a1a1a6' }}>
                                <span style={{ color: '#a78bfa' }}>[r]</span>
                                {' reply'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div
                    style={{
                        padding: '5px 12px',
                        borderTop: '1px solid #232427',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: '#111113',
                        color: '#71717a',
                        fontSize: 10.5,
                    }}
                >
                    <span
                        style={{
                            background: '#a78bfa',
                            color: '#08080a',
                            padding: '0 7px',
                            fontWeight: 600,
                        }}
                    >
                        NORMAL
                    </span>
                    <span>1/7</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>
                        filter: <span style={{ color: '#a78bfa' }}>priority&gt;=2</span>
                    </span>
                    <span style={{ marginLeft: 'auto' }}>
                        : cmd&nbsp;&nbsp; / search&nbsp;&nbsp; ? help&nbsp;&nbsp; q quit
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export const TuiKeybindings = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px 40px',
            marginBottom: 8,
        }}
    >
        {[
            [['j', 'k'], 'move down / up the stream'],
            [['g', 'G'], 'jump to top / bottom'],
            [['c'], 'focus the channel list'],
            [['↵'], 'open event in detail pane'],
            [['a'], 'acknowledge · clears it everywhere'],
            [['m'], 'mute the focused channel'],
            [['/'], 'incremental search'],
            [[':'], 'command mode (sub, publish, filter…)'],
            [['p'], 'cycle priority filter'],
            [['?'], 'help overlay'],
        ].map(([keys, desc], i) => (
            <div
                key={i}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: '1px solid #232427',
                }}
            >
                <span style={{ display: 'flex', gap: 5, width: 64, flexShrink: 0 }}>
                    {keys.map((k, j) => (
                        <span
                            key={j}
                            style={{
                                fontFamily:
                                    "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                                fontSize: 11,
                                color: '#f7f7f8',
                                background: '#191a1d',
                                border: '1px solid #232427',
                                borderBottom: '2px solid #232427',
                                borderRadius: 5,
                                padding: '2px 7px',
                                minWidth: 18,
                                display: 'inline-flex',
                                justifyContent: 'center',
                            }}
                        >
                            {k}
                        </span>
                    ))}
                </span>
                <span
                    style={{
                        fontFamily:
                            "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        fontSize: 13,
                        color: '#a1a1a6',
                    }}
                >
                    {desc}
                </span>
            </div>
        ))}
    </div>
);

export const TuiCode = () => (
    <div
        style={{
            margin: '16px 0',
            borderRadius: 11,
            overflow: 'hidden',
            border: '1px solid #232427',
            background: '#030304',
            boxShadow: '0 18px 50px -24px rgba(0,0,0,0.7)',
        }}
    >
        <div
            style={{
                height: 34,
                background: '#111113',
                borderBottom: '1px solid #232427',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 7,
            }}
        >
            <span
                style={{
                    width: 11,
                    height: 11,
                    borderRadius: 99,
                    background: '#ff5f57',
                    display: 'inline-block',
                }}
            />
            <span
                style={{
                    width: 11,
                    height: 11,
                    borderRadius: 99,
                    background: '#febc2e',
                    display: 'inline-block',
                }}
            />
            <span
                style={{
                    width: 11,
                    height: 11,
                    borderRadius: 99,
                    background: '#28c840',
                    display: 'inline-block',
                }}
            />
            <span
                style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                    fontSize: 11.5,
                    color: '#71717a',
                    marginLeft: -54,
                }}
            >
                src/tui/App.tsx
            </span>
        </div>
        <div
            style={{
                fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                fontSize: 13,
                lineHeight: 1.65,
                color: '#f7f7f8',
                padding: '16px 18px',
                overflowX: 'auto',
            }}
        >
            <div style={{ color: '#71717a', padding: '1px 0', whiteSpace: 'pre' }}>
                {'import { Box, Text, useInput, useApp } from "ink";'}
            </div>
            <div style={{ height: 8 }} />
            <div style={{ padding: '1px 0' }}>
                <span style={{ color: '#67e8f9' }}>const</span>{' '}
                <span style={{ color: '#f7f7f8' }}>App</span>
                {' = () => {'}
            </div>
            <div style={{ padding: '1px 0', color: '#f7f7f8' }}>
                {'  const stream = '}
                <span style={{ color: '#a78bfa' }}>useSignalStream</span>
                {'("priority>=2");'}
            </div>
            <div style={{ padding: '1px 0', color: '#f7f7f8' }}>
                {'  const [sel, setSel] = '}
                <span style={{ color: '#a78bfa' }}>useState</span>
                {'(0);'}
            </div>
            <div style={{ padding: '1px 0', color: '#f7f7f8' }}>
                {'  '}
                <span style={{ color: '#a78bfa' }}>useInput</span>
                {'((input, key) => { /* j/k, a, : … */ });'}
            </div>
            <div style={{ height: 6 }} />
            <div style={{ color: '#71717a', padding: '1px 0' }}>{'  return ('}</div>
            <div style={{ padding: '1px 0' }}>
                {'    '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>Box</span>{' '}
                <span style={{ color: '#67e8f9' }}>flexDirection</span>
                <span style={{ color: '#71717a' }}>{'='}</span>
                <span style={{ color: '#4ade80' }}>{'"column"'}</span>{' '}
                <span style={{ color: '#67e8f9' }}>height</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#fbbf24' }}>{'"100%"'}</span>
                <span style={{ color: '#71717a' }}>{'}>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'      '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>TopBar</span>{' '}
                <span style={{ color: '#67e8f9' }}>user</span>
                <span style={{ color: '#71717a' }}>{'='}</span>
                <span style={{ color: '#4ade80' }}>{'"alex@acme.io"'}</span>{' '}
                <span style={{ color: '#71717a' }}>{'/>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'      '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>Box</span>{' '}
                <span style={{ color: '#67e8f9' }}>flexGrow</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#fbbf24' }}>1</span>
                <span style={{ color: '#71717a' }}>{'}>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'        '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>ChannelList</span>{' '}
                <span style={{ color: '#67e8f9' }}>width</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#fbbf24' }}>22</span>
                <span style={{ color: '#71717a' }}>{'}'}</span>{' '}
                <span style={{ color: '#71717a' }}>{'/>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'        '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>Stream</span>{' '}
                <span style={{ color: '#67e8f9' }}>events</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#f7f7f8' }}>stream</span>
                <span style={{ color: '#71717a' }}>{'}'}</span>{' '}
                <span style={{ color: '#67e8f9' }}>selected</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#f7f7f8' }}>sel</span>
                <span style={{ color: '#71717a' }}>{'}'}</span>{' '}
                <span style={{ color: '#71717a' }}>{'/>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'        '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>Detail</span>{' '}
                <span style={{ color: '#67e8f9' }}>event</span>
                <span style={{ color: '#71717a' }}>{'={'}</span>
                <span style={{ color: '#71717a' }}>{'{'}</span>
                <span style={{ color: '#f7f7f8' }}>stream[sel]</span>
                <span style={{ color: '#71717a' }}>{'}'}</span>{' '}
                <span style={{ color: '#71717a' }}>{'/>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'      '}
                <span style={{ color: '#71717a' }}>{'</'}</span>
                <span style={{ color: '#fbbf24' }}>Box</span>
                <span style={{ color: '#71717a' }}>{'>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'      '}
                <span style={{ color: '#71717a' }}>{'<'}</span>
                <span style={{ color: '#fbbf24' }}>StatusBar</span>{' '}
                <span style={{ color: '#67e8f9' }}>mode</span>
                <span style={{ color: '#71717a' }}>{'='}</span>
                <span style={{ color: '#4ade80' }}>{'"NORMAL"'}</span>{' '}
                <span style={{ color: '#71717a' }}>{'/>'}</span>
            </div>
            <div style={{ padding: '1px 0' }}>
                {'    '}
                <span style={{ color: '#71717a' }}>{'</'}</span>
                <span style={{ color: '#fbbf24' }}>Box</span>
                <span style={{ color: '#71717a' }}>{'>'}</span>
            </div>
            <div style={{ color: '#71717a', padding: '1px 0' }}>{'  );'}</div>
            <div style={{ color: '#f7f7f8', padding: '1px 0' }}>{'};'}</div>
        </div>
    </div>
);
