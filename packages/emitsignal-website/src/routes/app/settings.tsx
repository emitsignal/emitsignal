import { createFileRoute, Outlet } from '@tanstack/react-router';

import { SettingsShell } from '#/components/app/settings/settings-shell';
import { Toolbar } from '#/components/app/toolbar';
import { useSession } from '#/ctx/session';

export const Route = createFileRoute('/app/settings')({ component: SettingsLayout });

function SettingsLayout() {
    const { user } = useSession();

    return (
        <>
            <Toolbar subtitle={user?.email} title="Settings" />
            <SettingsShell>
                <Outlet />
            </SettingsShell>
        </>
    );
}
