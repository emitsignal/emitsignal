export const TOPIC_NAME_MAX_LENGTH = 38;
export const TOPIC_NAME_REGEX = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/i;

export function isValidTopicName(name: string): boolean {
    return name.length <= TOPIC_NAME_MAX_LENGTH && TOPIC_NAME_REGEX.test(name);
}
