const { Command } = require('@chrisofnormandy/mariwoah-bot');

const features = require('./features');

const commands = [
    new Command(
        'accounts',
        'login',
        features.login
    )
        .setRegex(/(login)/)
        .setCommandDescription('Get an authentication token for the web panel.')
        .setAdminOnly(),
    new Command(
        'accounts',
        'reset',
        features.reset
    )
        .setRegex(/(reset)/)
        .setCommandDescription('Reset your user account.')
        .setAdminOnly(),
];

module.exports = {
    general: commands
};