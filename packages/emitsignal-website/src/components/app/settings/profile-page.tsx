import { GitBranch, Globe, Plus, Terminal, Upload, X } from 'lucide-react';

import { Avatar } from '#/components/ui/avatar';
import { useSession } from '#/ctx/session';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsField } from './settings-field';
import { SettingsInput } from './settings-input';
import { SettingsToggle } from './settings-toggle';

const PROFILE_LINKS = [
    { icon: Globe, value: 'alexcarter.dev' },
    { icon: GitBranch, value: 'github.com/alexc' },
    { icon: Terminal, value: 'mastodon.social/@alex' },
] as const;

const STATUS_OPTIONS = [
    { color: 'var(--color-success)', isActive: true, label: 'Available' },
    { color: 'var(--color-warn)', isActive: false, label: 'On call' },
    { color: 'var(--color-accent)', isActive: false, label: 'Focused' },
    { color: 'var(--color-dim)', isActive: false, label: 'Away' },
] as const;

const PREVIEW_LINKS = [Globe, GitBranch, Terminal] as const;

export function ProfilePage() {
    const { user } = useSession();
    const displayEmail = user?.email ?? 'alex@acme.io';

    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Profile</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    This is the public you — shown to teammates, on channels you publish to, and
                    next to every signal you emit.
                </p>
            </div>

            <div>
                <SettingsCard title="Identity">
                    <div className="mb-[22px] flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <Avatar name={displayEmail} rounded={16} size={72} />
                            <div className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full border-[3px] border-elev bg-success" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[17px] font-semibold">Alex Carter</div>
                            <div className="mt-1 font-mono text-[12px] text-dim">
                                @alex · she/her · online
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <SettingsButton icon={Upload} variant="ghost">
                                Upload
                            </SettingsButton>
                            <SettingsButton size="sm" variant="ghost">
                                Remove
                            </SettingsButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <SettingsField label="Display name">
                            <SettingsInput value="Alex Carter" />
                        </SettingsField>
                        <SettingsField label="Handle">
                            <SettingsInput monospace suffix="emitsignal.sh/u/alex" value="alex" />
                        </SettingsField>
                        <SettingsField label="Pronouns">
                            <SettingsInput value="she / her" />
                        </SettingsField>
                        <SettingsField label="Role / title">
                            <SettingsInput value="Staff Platform Engineer" />
                        </SettingsField>
                        <div className="sm:col-span-2">
                            <SettingsField
                                hint="Plain text · max 160 chars · shown on your public profile card"
                                label="Bio"
                            >
                                <div className="min-h-[56px] rounded-[7px] border border-line bg-elev px-3 py-2.5 text-[13.5px] leading-relaxed text-fg">
                                    Platform eng at acme · paged at 3am so you don&apos;t have to ·
                                    maintainer @ emitsignal
                                </div>
                            </SettingsField>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard
                    action={
                        <SettingsButton icon={Plus} variant="ghost">
                            Add link
                        </SettingsButton>
                    }
                    description="Shown as icons on your profile card."
                    title="Links"
                >
                    <div className="flex flex-col gap-2.5">
                        {PROFILE_LINKS.map((link) => {
                            const Icon = link.icon;
                            return (
                                <div className="flex items-center gap-2.5" key={link.value}>
                                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-elev text-muted">
                                        <Icon size={15} />
                                    </div>
                                    <SettingsInput monospace value={link.value} />
                                    <X
                                        className="shrink-0 cursor-pointer text-dim hover:text-fg"
                                        size={15}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </SettingsCard>

                <SettingsCard
                    description="Lets teammates know whether you're reachable before they route a signal your way."
                    title="Status & availability"
                >
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {STATUS_OPTIONS.map((status) => (
                            <div
                                className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-[11px] ${
                                    status.isActive ? 'border-current' : 'border-line bg-bg'
                                }`}
                                key={status.label}
                                style={
                                    status.isActive
                                        ? {
                                              background: `${status.color}14`,
                                              borderColor: status.color,
                                          }
                                        : undefined
                                }
                            >
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{
                                        background: status.color,
                                        boxShadow: `0 0 8px ${status.color}`,
                                    }}
                                />
                                <span
                                    className={`text-[13px] font-medium ${status.isActive ? 'text-fg' : 'text-muted'}`}
                                >
                                    {status.label}
                                </span>
                                {status.isActive ? (
                                    <span
                                        className="ml-auto font-mono text-[10px]"
                                        style={{ color: status.color }}
                                    >
                                        ACTIVE
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <SettingsToggle
                        defaultOn
                        description="Flip to « On call » automatically when PagerDuty shows you on rotation"
                        label="Sync status with on-call schedule"
                    />
                    <SettingsToggle
                        description="Currently 14:32 · Europe/Amsterdam"
                        label="Show local time on my profile"
                    />
                </SettingsCard>

                <SettingsCard
                    description="How others see your profile card when they hover your handle."
                    title="Public preview"
                >
                    <div className="flex items-start gap-4 rounded-[10px] border border-line bg-bg p-5">
                        <Avatar name={displayEmail} rounded={12} size={52} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-semibold">Alex Carter</span>
                                <span className="h-[7px] w-[7px] rounded-full bg-success" />
                                <span className="font-mono text-[11px] text-dim">@alex</span>
                            </div>
                            <div className="mt-0.5 font-mono text-[12px] text-accent">
                                Staff Platform Engineer · she/her
                            </div>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                                Platform eng at acme · paged at 3am so you don&apos;t have to ·
                                maintainer @ emitsignal
                            </p>
                            <div className="mt-3 flex gap-2">
                                {PREVIEW_LINKS.map((Icon, index) => (
                                    <div
                                        className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-elev text-muted"
                                        key={index}
                                    >
                                        <Icon size={13} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsCard>
            </div>
        </>
    );
}
