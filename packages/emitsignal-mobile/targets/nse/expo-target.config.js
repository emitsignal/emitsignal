/** @type {import('@bacons/apple-targets').ConfigFunction} */
module.exports = (config) => ({
    bundleIdentifier: '.nse',
    deploymentTarget: '17.0',
    displayName: 'EmitSignal Notification Service',
    entitlements: {
        'com.apple.security.application-groups': [`group.${config.ios.bundleIdentifier}`],
    },
    frameworks: ['UserNotifications', 'WidgetKit'],
    name: 'nse',
    type: 'notification-service',
});
