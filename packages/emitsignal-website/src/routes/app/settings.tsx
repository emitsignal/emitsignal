import { createFileRoute, Outlet } from '@tanstack/react-router';

import { SettingsShell } from '#/components/app/settings/settings-shell';
import { Toolbar } from '#/components/app/toolbar';

export const Route = createFileRoute('/app/settings')({ component: SettingsLayout });

function SettingsLayout() {
    return (
        <>
            <Toolbar title="Settings" />
            <SettingsShell>
                <Outlet />
            </SettingsShell>
        </>
    );
}
