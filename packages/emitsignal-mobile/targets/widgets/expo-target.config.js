/** @type {import('@bacons/apple-targets').ConfigFunction} */
module.exports = (config) => ({
    bundleIdentifier: '.widgets',
    colors: {
        $accent: '#a78bfa',
        $widgetBackground: '#000000',
    },
    deploymentTarget: '17.0',
    displayName: 'EmitSignal Widgets',
    entitlements: {
        'com.apple.security.application-groups': [`group.${config.ios.bundleIdentifier}`],
    },
    name: 'widgets',
    type: 'widget',
});
