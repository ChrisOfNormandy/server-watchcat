const os = require('os');
const fs = require('fs');

const { Output } = require('@chrisofnormandy/mariwoah-bot');

/**
 * 
 * @param {import('@chrisofnormandy/mariwoah-bot').MessageData} data 
 * @returns 
 */
module.exports = (data) => {
    if (!data.arguments.length) {
        const path = `${os.homedir}/.watchcat/users/${data.message.author.id}`;

        if (fs.existsSync(path + '.user'))
            fs.rmSync(path + '.user');

        if (fs.existsSync(path + '.session'))
            fs.rmSync(path + '.session');

        return new Output('Done.').resolve();
    }

    return new Output('You only need the command. No arguments ;)').resolve();
};