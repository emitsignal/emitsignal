const APPLE_USER_AGENT_PATTERN = /Mac|iPhone|iPad|iPod/;

export const isAppleDevice = (): boolean =>
    typeof navigator !== 'undefined' && APPLE_USER_AGENT_PATTERN.test(navigator.userAgent);
