import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Sidebar } from '#/components/app/sidebar';

export const Route = createFileRoute('/app')({ component: WebShell });

function WebShell() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg font-sans text-fg">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
