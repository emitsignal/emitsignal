import type { PushJob } from './types';

import { buildExpoMessages, sendExpoMessages } from './expo-client';
import { resolvePushTokens } from './recipients';

export type { PushJob } from './types';

export async function sendPushNotifications(job: PushJob): Promise<void> {
    const tokens = await resolvePushTokens(job.topicId);

    if (tokens.length === 0) {
        return;
    }

    await sendExpoMessages(buildExpoMessages(tokens, job));
}
