import { createFileRoute } from '@tanstack/react-router';

import { AccountPage } from '#/components/app/settings/account-page';

export const Route = createFileRoute('/app/settings/account')({ component: AccountPage });
