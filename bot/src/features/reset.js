const os = require('os');
const fs = require('fs');
const { Output } = require('@chrisofnormandy/mariwoah-bot');

module.exports = (message, data) => {
    if (!data.arguments.length) {
        return new Promise((resolve) => {
            const path = `${os.homedir}/.watchcat/users/${message.author.id}`;

            if (fs.existsSync(path + '.user'))
                fs.rmSync(path + '.user');
            if (fs.existsSync(path + '.session'))
                fs.rmSync(path + '.session');

            resolve(new Output('Done.'));
        });
    }

    return Promise.resolve(new Output());
};