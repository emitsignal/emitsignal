import type { Action } from '#/utils/actions';

export interface PushJob {
    actions: Action[];
    body: string;
    messageId: string;
    priority: number;
    title: string;
    topicDisplayName: string;
    topicId: string;
    topicName: string;
}
