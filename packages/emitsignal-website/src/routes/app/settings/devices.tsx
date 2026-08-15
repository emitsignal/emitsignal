import { createFileRoute } from '@tanstack/react-router';

import { DevicesPage } from '#/components/app/settings/devices-page';

export const Route = createFileRoute('/app/settings/devices')({ component: DevicesPage });
