import { createFileRoute } from '@tanstack/react-router';

import { AdvancedPage } from '#/components/app/settings/advanced-page';

export const Route = createFileRoute('/app/settings/advanced')({ component: AdvancedPage });
