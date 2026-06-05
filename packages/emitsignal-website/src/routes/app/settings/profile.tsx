import { createFileRoute } from '@tanstack/react-router';

import { ProfilePage } from '#/components/app/settings/profile-page';

export const Route = createFileRoute('/app/settings/profile')({ component: ProfilePage });
